import mongoose from "mongoose";
import User from "../models/user.model.js";

export const connectDB=async () => {
    if (!process.env.MONGODB_URL) {
        throw new Error("MONGODB_URL is missing from the billing service environment")
    }
    await mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    })
    await User.db.asPromise()
    console.log("Billing and auth databases connected")
}
