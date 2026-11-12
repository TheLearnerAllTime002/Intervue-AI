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

    return next(error)
}
