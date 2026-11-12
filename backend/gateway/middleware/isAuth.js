import { authLog } from "../../shared/diagnostics.js";
import { getRedisClient } from "../../shared/redis/redis.js";
import { getSessionId } from "../../shared/sessionConfig.js";

const redis = {
    get: (...args) => getRedisClient("gateway").get(...args),
};

export const createIsAuth = ({ sessionStore, logger = console.info }) => async (req, res, next) => {
    const sessionId = getSessionId(req.cookies);
    const requestId = req.requestId || "unknown";
    authLog("GATEWAY_COOKIE_RECEIVED", {
        requestId,
        service: "gateway",
        endpoint: req.path || req.url?.split("?")[0],
        cookiePresent: Boolean(sessionId),
    }, logger);

    if (!sessionId) {
        authLog("GATEWAY_SESSION_REJECTED", { requestId, service: "gateway", reason: "missing_cookie", status: 401 }, logger);
        return res.status(401).json({ message: "Unauthorized" });
    }

    let rawSession;
    try {
        rawSession = await sessionStore.get(`session:${sessionId}`);
        authLog("GATEWAY_SESSION_LOOKUP", {
            requestId,
            service: "gateway",
            namespace: "session:",
            outcome: rawSession ? "hit" : "miss",
        }, logger);
    } catch (error) {
        authLog("GATEWAY_SESSION_LOOKUP", {
            requestId,
            service: "gateway",
            namespace: "session:",
            outcome: "error",
            code: error?.code || "unknown",
        }, logger);
        return res.status(503).json({ message: "Session service is temporarily unavailable. Please try again shortly." });
    }

    if (!rawSession) {
        authLog("GATEWAY_SESSION_REJECTED", { requestId, service: "gateway", reason: "session_missing_or_expired", status: 401 }, logger);
        return res.status(401).json({ message: "Session Expired" });
    }

    let user;
    try {
        user = JSON.parse(rawSession);
    } catch {
        authLog("GATEWAY_SESSION_REJECTED", { requestId, service: "gateway", reason: "invalid_session_json", status: 401 }, logger);
        return res.status(401).json({ message: "Session invalid. Please sign in again." });
    }

    if (!user?.userId || typeof user.userId !== "string") {
        authLog("GATEWAY_SESSION_REJECTED", { requestId, service: "gateway", reason: "invalid_user_identity", status: 401 }, logger);
        return res.status(401).json({ message: "Session invalid. Please sign in again." });
    }

    req.user = user;
    authLog("GATEWAY_SESSION_VALIDATED", { requestId, service: "gateway", status: 200 }, logger);
    return next();
};

export const isAuth = createIsAuth({ sessionStore: redis });
