export const proxyErrorHandler = (error, res, next) => {
    const transientCodes = new Set([
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
        "EHOSTUNREACH",
        "ENOTFOUND",
    ])

    if (transientCodes.has(error?.code)) {
        return res.status(503).json({
            success: false,
            message: "The service is temporarily unavailable. Please try again shortly.",
        })
    }

    // An upstream proxy failure is a dependency outage from the API client's
    // point of view. Keep it distinct from an invalid token or bad request.
    console.error(JSON.stringify({ event: "GATEWAY_UPSTREAM_FAILURE", code: error?.code || error?.name || "unknown" }))
    return res.status(503).json({
        success: false,
        message: "The service is temporarily unavailable. Please try again shortly.",
    })
}
