import express from "express"
import { createOrder, getBillingHistory, verifyPayment } from "../controllers/billing.controller.js"

const billingRouter = express.Router()


billingRouter.post("/create",createOrder)
billingRouter.post("/verify",verifyPayment)
billingRouter.get("/history",getBillingHistory)

export default billingRouter
