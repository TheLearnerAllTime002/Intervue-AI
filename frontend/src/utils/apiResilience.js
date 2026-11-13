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

export const installApiResilience = (api, { sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) => {
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const config = error.config;
            if (!config) throw error;

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
