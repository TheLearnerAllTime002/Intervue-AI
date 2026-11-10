import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

if (!process.env.AUTH_MONGODB_URL) {
  throw new Error("AUTH_MONGODB_URL must point to the auth service database in the billing environment.");
}

const authConnection = mongoose.createConnection(process.env.AUTH_MONGODB_URL);

const coinTransactionSchema = new mongoose.Schema({
  kind: { type: String, enum: ["usage", "purchase"], required: true },
  action: { type: String, required: true },
  coins: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  interviewCoin: { type: Number, default: 150 },
  processedBillingOrderIds: { type: [String], default: [] },
  coinHistory: { type: [coinTransactionSchema], default: [] },
}, { timestamps: true });

const User = authConnection.model("User", userSchema);

export default User;
