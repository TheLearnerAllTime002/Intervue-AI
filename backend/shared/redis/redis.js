import { createHash, createHmac } from "node:crypto";
import Redis from "ioredis"

const clients = new Map();

const endpointFingerprint = (redisUrl) => {
    try {
        const parsed = new URL(redisUrl);
        const defaultPort = parsed.protocol === "rediss:" ? "6380" : "6379";
        const database = parsed.pathname.replace(/^\//, "") || "0";
        const safeEndpoint = `${parsed.protocol}//${parsed.hostname}:${parsed.port || defaultPort}/${database}`;
        return createHash("sha256").update(safeEndpoint).digest("hex").slice(0, 16);
    } catch {
        return "invalid";
    }
};

const credentialFingerprint = (redisUrl, diagnosticKey) => {
    if (!diagnosticKey) return null;
    try {
        const parsed = new URL(redisUrl);
        return createHmac("sha256", diagnosticKey)
            .update(`${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`)
            .digest("hex")
            .slice(0, 16);
    } catch {
        return "invalid";
    }
};

export const getRedisDiagnosticFingerprints = (redisUrl, diagnosticKey = process.env.INTERNAL_SERVICE_SECRET) => ({
    endpointFingerprint: endpointFingerprint(redisUrl),
    credentialFingerprint: credentialFingerprint(redisUrl, diagnosticKey),
});

export const getRedisClient = (serviceName = "backend") => {
    if (clients.has(serviceName)) return clients.get(serviceName);

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl && process.env.NODE_ENV === "production") {
        throw new Error("REDIS_URL is required in production");
    }

    const resolvedUrl = redisUrl || "redis://127.0.0.1:6380";
    const { endpointFingerprint: fingerprint, credentialFingerprint: authFingerprint } = getRedisDiagnosticFingerprints(resolvedUrl);
    const client = new Redis(resolvedUrl);
    let lastErrorLogAt = 0;

    client.on("ready", () => {
        console.info(JSON.stringify({
            event: "REDIS_CONNECTION_READY",
            service: serviceName,
            endpointFingerprint: fingerprint,
            credentialFingerprint: authFingerprint,
        }));
    });
    client.on("error", (error) => {
        const now = Date.now();
        if (now - lastErrorLogAt < 30000) return;
        lastErrorLogAt = now;
        console.error(JSON.stringify({
            event: "REDIS_CONNECTION_FAILURE",
            service: serviceName,
            endpointFingerprint: fingerprint,
            credentialFingerprint: authFingerprint,
            code: error?.code || "unknown",
        }));
    });

    clients.set(serviceName, client);
    return client;
};
