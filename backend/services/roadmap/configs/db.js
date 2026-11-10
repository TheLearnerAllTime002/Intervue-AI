import mongoose from "mongoose";

export const connectDB=async () => {
    const mongoUrl = process.env.MONGODB_URL
    if (!mongoUrl) {
        throw new Error("MONGODB_URL is missing from the roadmap service environment")
    }

    await mongoose.connect(mongoUrl, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    })
    console.log("Roadmap database connected")
}
