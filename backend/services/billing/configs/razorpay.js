import dotenv from "dotenv"
import { fileURLToPath } from "node:url"

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) })
import Razorpay from "razorpay"

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in the billing service environment.")
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

export default razorpay
