import test from "node:test";
import assert from "node:assert/strict";
import { createIsAuth } from "../middleware/isAuth.js";
import { proxyErrorHandler } from "../utils/proxyErrorHandler.js";

const createResponse = () => ({
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
});

const runMiddleware = async ({ cookie, value, redisError } = {}) => {
    const logs = [];
    const calls = [];
    const middleware = createIsAuth({
        sessionStore: {
            async get(key) {
                calls.push(key);
                if (redisError) throw redisError;
                return value ?? null;
            },
        },
        logger: (entry) => logs.push(JSON.parse(entry)),
    });
    const req = { cookies: cookie ? { session: cookie } : {}, requestId: "test-request", originalUrl: "/api/me" };
    const res = createResponse();
    let nextCalled = false;
    await middleware(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled, logs, calls };
};

test("returns 401 when the session cookie is missing", async () => {
    const result = await runMiddleware();
    assert.equal(result.res.statusCode, 401);
    assert.equal(result.nextCalled, false);
    assert.deepEqual(result.calls, []);
    assert.equal(result.logs.some(({ event }) => event === "GATEWAY_SESSION_REJECTED"), true);
});

test("returns 401 when the Redis session is missing or expired", async () => {
    const result = await runMiddleware({ cookie: "opaque-session" });
    assert.equal(result.res.statusCode, 401);
    assert.deepEqual(result.calls, ["session:opaque-session"]);
});

test("returns 503 when Redis is unavailable", async () => {
    const result = await runMiddleware({ cookie: "opaque-session", redisError: Object.assign(new Error("down"), { code: "ECONNREFUSED" }) });
    assert.equal(result.res.statusCode, 503);
    assert.equal(result.nextCalled, false);
    assert.equal(result.logs.some(({ event, outcome }) => event === "GATEWAY_SESSION_LOOKUP" && outcome === "error"), true);
});

test("rejects malformed session data and never accepts a forged user id object", async () => {
    const malformed = await runMiddleware({ cookie: "opaque-session", value: "{" });
    const invalidIdentity = await runMiddleware({ cookie: "opaque-session", value: JSON.stringify({ userId: { $ne: null } }) });
    assert.equal(malformed.res.statusCode, 401);
    assert.equal(invalidIdentity.res.statusCode, 401);
});

test("validates the session and populates the exact serialized user identity", async () => {
    const result = await runMiddleware({ cookie: "opaque-session", value: JSON.stringify({ userId: "mongo-id", name: "Test" }) });
    assert.equal(result.res.statusCode, 200);
    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.req.user, { userId: "mongo-id", name: "Test" });
    assert.equal(result.logs.some(({ event }) => event === "GATEWAY_SESSION_VALIDATED"), true);
});

test("proxy failures return 503 and log a request ID and route without sensitive values", () => {
    const logs = [];
    const originalError = console.error;
    console.error = (entry) => logs.push(JSON.parse(entry));
    const res = {
        req: { requestId: "request-123", baseUrl: "/api/auth", path: "/login?secret=hidden" },
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
    try {
        proxyErrorHandler(Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" }), res, () => {});
    } finally {
        console.error = originalError;
    }
    assert.equal(res.statusCode, 503);
    assert.equal(logs[0].requestId, "request-123");
    assert.equal(logs[0].route, "/api/auth");
    assert.equal(logs[0].endpoint, "/login");
    assert.equal(JSON.stringify(logs[0]).includes("hidden"), false);
});
