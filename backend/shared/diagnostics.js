import { randomUUID } from "node:crypto";

export const ensureRequestId = (req, res, next) => {
    const incoming = req.get?.("x-request-id") || req.headers?.["x-request-id"];
    req.requestId = typeof incoming === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(incoming)
        ? incoming
        : randomUUID();
    res?.setHeader?.("x-request-id", req.requestId);
    next();
};

export const authLog = (event, fields = {}, logger = console.info) => {
    logger(JSON.stringify({ event, ...fields }));
};
