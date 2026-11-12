import test from "node:test";
import assert from "node:assert/strict";
import { getRedisDiagnosticFingerprints } from "../../shared/redis/redis.js";

test("Redis endpoint and credential fingerprints match only matching connection configuration", () => {
    const first = getRedisDiagnosticFingerprints("rediss://user:password@redis.example:6380/2", "shared-internal-key");
    const same = getRedisDiagnosticFingerprints("rediss://user:password@redis.example:6380/2", "shared-internal-key");
    const otherDatabase = getRedisDiagnosticFingerprints("rediss://user:password@redis.example:6380/3", "shared-internal-key");
    const otherCredentials = getRedisDiagnosticFingerprints("rediss://user:other-password@redis.example:6380/2", "shared-internal-key");

    assert.deepEqual(first, same);
    assert.notEqual(first.endpointFingerprint, otherDatabase.endpointFingerprint);
    assert.equal(first.credentialFingerprint, otherDatabase.credentialFingerprint);
    assert.notEqual(first.credentialFingerprint, otherCredentials.credentialFingerprint);
    assert.equal(JSON.stringify(first).includes("password"), false);
});
