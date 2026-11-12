const wakeRetryDelays = [1000, 2000, 4000, 8000, 15000, 20000];

const isAuthEndpoint = (url = "") => url.includes("/api/auth/");
const isRetryableWakeupRequest = (config, error) => {
    const method = (config.method || "get").toLowerCase();
    const isRead = ["get", "head", "options"].includes(method);
    // Login creates only a short lived Redis session, so a few retries while
    // Auth starts are safe. Other writes are deliberately never replayed.
    const isLogin = config.url?.includes("/api/auth/login") && method === "post";
    if ((!isRead || isAuthEndpoint(config.url)) && !isLogin) return false;
    const status = error.response?.status;
    return [502, 503, 504].includes(status) || (!error.response && ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(error.code));
};

export const installApiResilience = (api, auth, { sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) => {
    const sessionLogins = new Map();

    const establishSession = (firebaseUser) => {
        const uid = firebaseUser.uid;
        const existing = sessionLogins.get(uid);
        if (existing) return existing;

        const operation = firebaseUser.getIdToken(true)
            .then((token) => api.post("/api/auth/login", { token }, { _skipSessionRecovery: true }))
            .finally(() => {
                if (sessionLogins.get(uid) === operation) sessionLogins.delete(uid);
            });
        sessionLogins.set(uid, operation);
        return operation;
    };

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const config = error.config;
            if (!config) throw error;

            if (error.response?.status === 401 && !config._sessionRecoveryAttempted && !config._skipSessionRecovery && !isAuthEndpoint(config.url) && auth.currentUser) {
                config._sessionRecoveryAttempted = true;
                await establishSession(auth.currentUser);
                return api.request(config);
            }

            if (isRetryableWakeupRequest(config, error)) {
                const attempt = config._wakeRetryAttempt || 0;
                const maxAttempts = config.url?.includes("/api/auth/login") ? 3 : wakeRetryDelays.length;
                if (attempt < maxAttempts) {
                    config._wakeRetryAttempt = attempt + 1;
                    await sleep(wakeRetryDelays[attempt]);
                    return api.request(config);
                }
            }

            throw error;
        }
    );
};
