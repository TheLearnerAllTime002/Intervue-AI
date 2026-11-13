import test from "node:test";
import assert from "node:assert/strict";
import { installApiResilience } from "./apiResilience.js";

const client = () => {
    let onRejected;
    const requests = [];
    const api = {
        interceptors: { response: { use: (_ok, rejected) => { onRejected = rejected; } } },
        request: async (config) => { requests.push(config); return { status: 200, config }; },
        post: async (...args) => { requests.push(args); return { status: 200 }; },
    };
    installApiResilience(api, { sleep: async () => {} });
    return { api, requests, reject: onRejected };
};

test("does not recover protected 401 responses in the request interceptor", async () => {
    const { requests, reject } = client();
    const config = { method: "get", url: "/api/interview/all" };
    const error = { config, response: { status: 401 } };

    await assert.rejects(reject(error), (caught) => caught === error);
    assert.deepEqual(requests, []);
});

test("retries temporary failures for safe reads", async () => {
    const delays = [];
    let onRejected;
    const api = {
        interceptors: { response: { use: (_ok, rejected) => { onRejected = rejected; } } },
        request: async (config) => ({ status: 200, config }),
        post: async () => ({ status: 200 }),
    };
    installApiResilience(api, { sleep: async (ms) => delays.push(ms) });
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
