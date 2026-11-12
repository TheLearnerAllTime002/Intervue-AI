import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import proxy from "express-http-proxy";
import cookieParser from "cookie-parser";
import { createIsAuth } from "../middleware/isAuth.js";
import { proxyWithHeaders } from "../utils/proxyWithHeaders.js";
import { requireGateway } from "../../shared/serviceAuth.js";
import { ensureRequestId } from "../../shared/diagnostics.js";

const listen = (app) => new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
});

const origin = (server) => `http://127.0.0.1:${server.address().port}`;

test("Auth proxy preserves Set-Cookie through the proxy response", async (t) => {
    const originalSecret = process.env.INTERNAL_SERVICE_SECRET;
    process.env.INTERNAL_SERVICE_SECRET = "test-internal-secret";
    t.after(() => {
        if (originalSecret === undefined) delete process.env.INTERNAL_SERVICE_SECRET;
        else process.env.INTERNAL_SERVICE_SECRET = originalSecret;
    });

    const authService = express();
    authService.use(requireGateway);
    authService.use(express.json());
    authService.post("/login", (req, res) => {
        assert.deepEqual(req.body, { token: "firebase-token" });
        res.cookie("session", "opaque-session", { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
        res.json({ success: true });
    });
    const authServer = await listen(authService);
    t.after(() => authServer.close());

    const gateway = express();
    gateway.use(ensureRequestId);
    gateway.use("/api/auth", proxy(origin(authServer), {
        parseReqBody: false,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["x-request-id"] = srcReq.requestId;
            proxyReqOpts.headers["x-gateway-secret"] = process.env.INTERNAL_SERVICE_SECRET;
            return proxyReqOpts;
        },
    }));
    const gatewayServer = await listen(gateway);
    t.after(() => gatewayServer.close());

    const response = await fetch(`${origin(gatewayServer)}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "firebase-token" }),
    });
    const setCookie = response.headers.get("set-cookie");
    assert.equal(response.status, 200);
    assert.match(setCookie, /^session=opaque-session;/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.ok(response.headers.get("x-request-id"));
});

test("protected proxy validates Redis session and replaces forged identity headers", async (t) => {
    const originalSecret = process.env.INTERNAL_SERVICE_SECRET;
    process.env.INTERNAL_SERVICE_SECRET = "test-internal-secret";
    t.after(() => {
        if (originalSecret === undefined) delete process.env.INTERNAL_SERVICE_SECRET;
        else process.env.INTERNAL_SERVICE_SECRET = originalSecret;
    });

    const downstream = express();
    downstream.use(requireGateway);
    downstream.get("/private", (req, res) => res.json({
        userId: req.get("x-user-id"),
        sessionId: req.get("x-session-id"),
        requestId: req.get("x-request-id"),
    }));
    const downstreamServer = await listen(downstream);
    t.after(() => downstreamServer.close());

    const gateway = express();
    gateway.use(ensureRequestId, cookieParser());
    gateway.use("/api/private", createIsAuth({
        sessionStore: { get: async () => JSON.stringify({ userId: "mongo-user-id" }) },
        logger: () => {},
    }), proxyWithHeaders(origin(downstreamServer)));
    const gatewayServer = await listen(gateway);
    t.after(() => gatewayServer.close());

    const response = await fetch(`${origin(gatewayServer)}/api/private/private`, {
        headers: { cookie: "session=opaque-session", "x-user-id": "attacker-id", "x-session-id": "attacker-session" },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.userId, "mongo-user-id");
    assert.equal(body.sessionId, "opaque-session");
    assert.ok(body.requestId);
});

test("downstream 401 remains a 401 and carries its response body", async (t) => {
    const downstream = express();
    downstream.get("/private", (_req, res) => res.status(401).json({ message: "Downstream session rejected" }));
    const downstreamServer = await listen(downstream);
    t.after(() => downstreamServer.close());

    const gateway = express();
    gateway.use(ensureRequestId, cookieParser());
    gateway.use("/api/private", createIsAuth({
        sessionStore: { get: async () => JSON.stringify({ userId: "mongo-user-id" }) },
        logger: () => {},
    }), proxyWithHeaders(origin(downstreamServer)));
    const gatewayServer = await listen(gateway);
    t.after(() => gatewayServer.close());

    const response = await fetch(`${origin(gatewayServer)}/api/private/private`, { headers: { cookie: "session=opaque-session" } });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "Downstream session rejected" });
});

test("downstream 502 is logged with its source and remains visible to the client", async (t) => {
    const downstream = express();
    downstream.get("/private", (_req, res) => res.status(502).json({ message: "Upstream dependency failed" }));
    const downstreamServer = await listen(downstream);
    t.after(() => downstreamServer.close());

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (entry) => warnings.push(JSON.parse(entry));
    t.after(() => { console.warn = originalWarn; });

    const gateway = express();
    gateway.use(ensureRequestId, cookieParser());
    gateway.use("/api/private", createIsAuth({
        sessionStore: { get: async () => JSON.stringify({ userId: "mongo-user-id" }) },
        logger: () => {},
    }), proxyWithHeaders(origin(downstreamServer)));
    const gatewayServer = await listen(gateway);
    t.after(() => gatewayServer.close());

    const response = await fetch(`${origin(gatewayServer)}/api/private/private`, { headers: { cookie: "session=opaque-session" } });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { message: "Upstream dependency failed" });
    assert.equal(warnings[0].event, "DOWNSTREAM_SERVICE_FAILURE");
    assert.equal(warnings[0].service, "127.0.0.1");
    assert.equal(warnings[0].status, 502);
    assert.ok(warnings[0].requestId);
});
