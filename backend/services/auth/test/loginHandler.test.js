import test from "node:test";
import assert from "node:assert/strict";
import { createLoginHandler, createLogoutHandler } from "../controllers/loginHandler.js";
import { SESSION_TTL_SECONDS } from "../../../shared/sessionConfig.js";

const createResponse = () => ({
    statusCode: 200,
    body: undefined,
    cookieValue: undefined,
    cookieOptions: undefined,
    clearedCookie: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    cookie(name, value, options) { this.cookieValue = { name, value }; this.cookieOptions = options; return this; },
    clearCookie(name, options) { this.clearedCookie = { name, options }; return this; },
});

const createRequest = (token = "firebase-id-token") => ({
    body: token === null ? {} : { token },
    cookies: {},
    requestId: "test-request",
    originalUrl: "/login",
    protocol: "https",
    get: () => undefined,
});

test("valid token creates one Redis session and issues a secure HTTP-only cookie", async () => {
    const user = { _id: "mongo-user-id", firebaseUid: "firebase-uid", email: "person@example.com", name: "Person", interviewCoin: 250 };
    const writes = [];
    const res = createResponse();
    const handler = createLoginHandler({
        verifyIdToken: async () => ({ uid: "firebase-uid", email: user.email, email_verified: true, aud: "intervue-ai-003" }),
        User: { findOne: async () => null, create: async () => user },
        redis: { set: async (...args) => writes.push(args) },
        logger: () => {},
    });

    await handler(createRequest(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user, user);
    assert.equal(res.cookieValue.name, "session");
    assert.equal(res.cookieOptions.httpOnly, true);
    assert.equal(res.cookieOptions.secure, true);
    assert.equal(res.cookieOptions.sameSite, "lax");
    assert.equal(res.cookieOptions.path, "/");
    assert.equal("domain" in res.cookieOptions, false);
    assert.equal(res.cookieOptions.maxAge, SESSION_TTL_SECONDS * 1000);
    assert.equal(writes.length, 1);
    assert.equal(writes[0][0], `session:${res.cookieValue.value}`);
    assert.equal(JSON.parse(writes[0][1]).userId, user._id);
    assert.deepEqual(writes[0].slice(2), ["EX", SESSION_TTL_SECONDS]);
});

test("rejects an invalid Firebase token with 401", async () => {
    const res = createResponse();
    const handler = createLoginHandler({
        verifyIdToken: async () => { throw Object.assign(new Error("invalid"), { code: "auth/invalid-id-token" }); },
        User: { findOne: async () => assert.fail("must not query users") },
        redis: { set: async () => assert.fail("must not create a session") },
        logger: () => {},
    });
    await handler(createRequest(), res);
    assert.equal(res.statusCode, 401);
});

test("rejects a token whose email is not verified", async () => {
    const res = createResponse();
    const handler = createLoginHandler({
        verifyIdToken: async () => ({ uid: "firebase-uid", email: "person@example.com", email_verified: false }),
        User: { findOne: async () => assert.fail("must not query users") },
        redis: { set: async () => assert.fail("must not create a session") },
        logger: () => {},
    });
    await handler(createRequest(), res);
    assert.equal(res.statusCode, 401);
});

test("existing users are looked up by Firebase UID and not recreated", async () => {
    const user = { _id: "mongo-user-id", firebaseUid: "firebase-uid", email: "person@example.com", name: "Person", interviewCoin: 250 };
    let creates = 0;
    const res = createResponse();
    const handler = createLoginHandler({
        verifyIdToken: async () => ({ uid: "firebase-uid", email: user.email, email_verified: true }),
        User: { findOne: async (query) => query.firebaseUid ? user : null, create: async () => { creates += 1; return user; } },
        redis: { set: async () => {} },
        logger: () => {},
    });
    await handler(createRequest(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(creates, 0);
});

test("Redis write failure returns 503 and does not issue a cookie", async () => {
    const res = createResponse();
    const handler = createLoginHandler({
        verifyIdToken: async () => ({ uid: "firebase-uid", email: "person@example.com", email_verified: true }),
        User: { findOne: async () => null, create: async () => ({ _id: "mongo-user-id", firebaseUid: "firebase-uid", email: "person@example.com", name: "Person" }) },
        redis: { set: async () => { throw Object.assign(new Error("offline"), { code: "ECONNREFUSED" }); } },
        logger: () => {},
    });
    await handler(createRequest(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.cookieValue, undefined);
});

test("logout deletes the Redis session before clearing the matching cookie", async () => {
    const order = [];
    const res = createResponse();
    const handler = createLogoutHandler({ redis: { del: async (key) => { order.push(`del:${key}`); } }, logger: () => {} });
    await handler({ ...createRequest(), cookies: { session: "opaque-session" } }, res);
    order.push(`clear:${res.clearedCookie.name}`);
    assert.deepEqual(order, ["del:session:opaque-session", "clear:session"]);
    assert.equal(res.statusCode, 200);
    assert.equal(res.clearedCookie.options.httpOnly, true);
    assert.equal(res.clearedCookie.options.secure, true);
    assert.equal(res.clearedCookie.options.sameSite, "lax");
});

test("logout reports Redis failures and keeps the cookie available for retry", async () => {
    const res = createResponse();
    const handler = createLogoutHandler({ redis: { del: async () => { throw new Error("offline"); } }, logger: () => {} });
    await handler({ ...createRequest(), cookies: { session: "opaque-session" } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.clearedCookie, undefined);
});
