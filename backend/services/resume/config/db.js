import mongoose from "mongoose";

export const connectDB=async () => {
    const mongoUrl = process.env.MONGODB_URL
    if (!mongoUrl) {
        throw new Error("MONGODB_URL is missing from the resume service environment")
    }

    await mongoose.connect(mongoUrl)
    console.log("Resume database connected")
}
