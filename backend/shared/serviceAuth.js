import crypto from "node:crypto";

if (process.env.NODE_ENV === "production" && !process.env.INTERNAL_SERVICE_SECRET) {
    throw new Error("INTERNAL_SERVICE_SECRET is required in production");
}

export const requireGateway = (req, res, next) => {
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    if (!expected && process.env.NODE_ENV === "production") {
        return res.status(503).json({ success: false, message: "Service authentication is not configured" });
    }

    if (expected) {
        const supplied = req.get("x-gateway-secret") || "";
        const expectedBuffer = Buffer.from(expected);
        const suppliedBuffer = Buffer.from(supplied);
        if (
            expectedBuffer.length !== suppliedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
        ) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
    }

    return next();
};
