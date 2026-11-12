import test from "node:test";
import assert from "node:assert/strict";
import { installApiResilience } from "./apiResilience.js";

const client = (auth) => {
    let onRejected;
    const requests = [];
    const api = {
        interceptors: { response: { use: (_ok, rejected) => { onRejected = rejected; } } },
        request: async (config) => { requests.push(config); return { status: 200, config }; },
        post: async (...args) => { requests.push(args); return { status: 200 }; },
    };
    installApiResilience(api, auth, { sleep: async () => {} });
    return { api, requests, reject: onRejected };
};

test("a protected 401 logs in once with a fresh Firebase token and retries the request", async () => {
    let tokenRefreshes = 0;
    const { requests, reject } = client({ currentUser: {
        uid: "user-1",
        getIdToken: async (forceRefresh) => { assert.equal(forceRefresh, true); tokenRefreshes += 1; return "valid-token"; },
    } });
    const config = { method: "get", url: "/api/interview/all" };

    const response = await reject({ config, response: { status: 401 } });
    assert.equal(response.status, 200);
    assert.equal(tokenRefreshes, 1);
    assert.equal(requests[0][0], "/api/auth/login");
    assert.deepEqual(requests[0][1], { token: "valid-token" });
    assert.equal(requests[1], config);
});

test("retries temporary failures for safe reads", async () => {
    const delays = [];
    let onRejected;
    const api = {
        interceptors: { response: { use: (_ok, rejected) => { onRejected = rejected; } } },
        request: async (config) => ({ status: 200, config }),
        post: async () => ({ status: 200 }),
    };
    installApiResilience(api, { currentUser: null }, { sleep: async (ms) => delays.push(ms) });
    const config = { method: "get", url: "/api/resume/get-resume" };
    const response = await onRejected({ config, response: { status: 502 } });
    assert.equal(response.status, 200);
    assert.deepEqual(delays, [1000]);
});

test("does not replay writes after a gateway failure", async () => {
    const { reject } = client({ currentUser: null });
    const config = { method: "post", url: "/api/interview/start" };
    const error = { config, response: { status: 502 } };
    await assert.rejects(reject(error), (caught) => caught === error);
});
