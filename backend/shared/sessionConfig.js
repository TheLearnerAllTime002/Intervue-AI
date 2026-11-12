export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
// A new name avoids collisions with legacy `session` cookies left in normal
// browser profiles from earlier deployments.
export const SESSION_COOKIE_NAME = "intervue_session_v2";
export const LEGACY_SESSION_COOKIE_NAME = "session";

export const getSessionId = (cookies = {}) =>
    cookies[SESSION_COOKIE_NAME] || cookies[LEGACY_SESSION_COOKIE_NAME] || null;

export const getSessionCookieOptions = (req, env = process.env) => {
    const forwardedProtocol = req.get?.("x-forwarded-proto")?.split(",")[0]?.trim();
    const isHttps = env.NODE_ENV === "production" || forwardedProtocol === "https" || req.protocol === "https";

    return {
        httpOnly: true,
        secure: isHttps,
        // Production API calls are same-origin through the Vercel rewrite, so
        // Lax supports the app flow without making the cookie cross-site.
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS * 1000,
    };
};
