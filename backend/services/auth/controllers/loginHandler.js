import { randomUUID } from "node:crypto";
import { authLog } from "../../../shared/diagnostics.js";
import { getSessionCookieOptions, SESSION_TTL_SECONDS } from "../../../shared/sessionConfig.js";

const isInvalidFirebaseToken = (error) => [
    "auth/id-token-expired",
    "auth/id-token-revoked",
    "auth/invalid-id-token",
    "auth/argument-error",
    "auth/invalid-credential",
].includes(error?.code);

export const isDependencyUnavailable = (error) =>
    /\b(EACCES|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|MongooseServerSelectionError|MongoServerSelectionError|MaxRetriesPerRequestError)\b/i.test(
        `${error?.code || ""} ${error?.message || ""} ${error?.cause?.code || ""}`
    ) || ["MongooseServerSelectionError", "MongoServerSelectionError", "MaxRetriesPerRequestError"].includes(error?.name);

export const createLoginHandler = ({ verifyIdToken, User, redis, logger = console.info }) => async (req, res) => {
    const requestId = req.requestId || "unknown";
    const log = (event, fields = {}) => authLog(event, {
        requestId,
        service: "auth",
        endpoint: req.path || req.url?.split("?")[0],
        ...fields,
    }, logger);

    log("AUTH_LOGIN_RECEIVED", { tokenPresent: typeof req.body?.token === "string" && Boolean(req.body.token.trim()) });
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!token) return res.status(400).json({ message: "Firebase token is required" });

    try {
        const decoded = await verifyIdToken(token);
        if (!decoded.uid || !decoded.email || decoded.email_verified !== true) {
            log("FIREBASE_TOKEN_REJECTED", { reason: "missing_verified_identity", status: 401 });
            return res.status(401).json({ message: "The Firebase token has no usable verified user identity." });
        }
        log("FIREBASE_TOKEN_VERIFIED", { firebaseProjectId: decoded.aud || "unknown" });

        let user = await User.findOne({ firebaseUid: decoded.uid });
        if (!user) user = await User.findOne({ email: decoded.email });
        const created = !user;

        if (created) {
            user = await User.create({
                firebaseUid: decoded.uid,
                email: decoded.email,
                name: decoded.name || decoded.email.split("@")[0],
            });
        } else if (user.firebaseUid !== decoded.uid) {
            user.firebaseUid = decoded.uid;
            user.name = decoded.name || user.name || decoded.email.split("@")[0];
            await user.save();
        }
        log("MONGODB_USER_RESOLVED", { created });

        const sessionId = randomUUID();
        const userId = String(user._id);
        const session = {
            userId,
            name: user.name,
            email: user.email,
            interviewCoin: user.interviewCoin,
        };
        await redis.set(`session:${sessionId}`, JSON.stringify(session), "EX", SESSION_TTL_SECONDS);
        log("REDIS_SESSION_WRITE_SUCCESS", { namespace: "session:", ttlSeconds: SESSION_TTL_SECONDS });

        res.cookie("session", sessionId, getSessionCookieOptions(req));
        log("AUTH_COOKIE_ISSUED", { httpOnly: true, secure: getSessionCookieOptions(req).secure, sameSite: "lax" });
        return res.json({ success: true, user });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Your account could not be linked because the email is already in use." });
        }

        if (isInvalidFirebaseToken(error)) {
            log("FIREBASE_TOKEN_REJECTED", { reason: error.code, status: 401 });
            return res.status(401).json({ message: "Unable to verify the sign-in token. Please sign in again." });
        }

        const unavailable = isDependencyUnavailable(error);
        authLog("AUTH_LOGIN_FAILURE", {
            requestId,
            service: "auth",
            endpoint: req.path || req.url?.split("?")[0],
            code: error?.code || error?.name || "unknown",
        }, logger);
        return res.status(unavailable ? 503 : 500).json({
            message: unavailable
                ? "Sign-in services are temporarily unavailable. Please try again shortly."
                : "Could not complete sign-in. Please try again.",
        });
    }
};

export const createLogoutHandler = ({ redis, logger = console.info }) => async (req, res) => {
    const sessionId = req.cookies?.session;
    try {
        if (sessionId) await redis.del(`session:${sessionId}`);
        res.clearCookie("session", getSessionCookieOptions(req));
        return res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        authLog("AUTH_LOGOUT_FAILURE", {
            requestId: req.requestId || "unknown",
            service: "auth",
            code: error?.code || "unknown",
        }, logger);
        return res.status(503).json({ success: false, message: "Session service is temporarily unavailable. Please try again shortly." });
    }
};
