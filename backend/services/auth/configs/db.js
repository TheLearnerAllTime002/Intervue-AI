import mongoose from "mongoose"
export const connectDb= async()=>{
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error("MONGODB_URL is missing from the auth service environment");
  }

  await mongoose.connect(mongoUrl);
  console.log("Auth database connected");
}
