export const proxyErrorHandler = (error, res, next) => {
    const req = res.req;
    const diagnostic = {
        requestId: req?.requestId || "unknown",
        route: req?.baseUrl || "unknown",
        endpoint: req?.path?.split("?")[0] || req?.url?.split("?")[0] || "unknown",
        code: error?.code || error?.name || "unknown",
    };
    const transientCodes = new Set([
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
        "EHOSTUNREACH",
        "ENOTFOUND",
    ])

    if (transientCodes.has(error?.code)) {
        console.error(JSON.stringify({ event: "GATEWAY_UPSTREAM_FAILURE", ...diagnostic, status: 503 }));
        return res.status(503).json({
            success: false,
            message: "The service is temporarily unavailable. Please try again shortly.",
        })
    }

    // An upstream proxy failure is a dependency outage from the API client's
    // point of view. Keep it distinct from an invalid token or bad request.
    console.error(JSON.stringify({ event: "GATEWAY_UPSTREAM_FAILURE", ...diagnostic, status: 503 }));
    return res.status(503).json({
        success: false,
        message: "The service is temporarily unavailable. Please try again shortly.",
    })
}
