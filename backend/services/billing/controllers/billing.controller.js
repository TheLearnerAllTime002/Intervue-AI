import crypto from "crypto";
import razorpay from "../configs/razorpay.js";
import Billing from "../models/billing.model.js";
import redis from "../../../shared/redis/redis.js";

const PLANS = {
  starter: {
    amount: 199,
    interviewCoins: 300,
  },
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const plan = PLANS[req.body?.planId];

    if (!userId) {
      return res.status(401).json({ success: false, message: "Sign in before purchasing coins." });
    }

    if (!plan) {
      return res.status(400).json({ success: false, message: "Invalid plan." });
    }

    const amountInPaise = plan.amount * 100;
    if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ success: false, message: "The order amount must be at least 100 paise." });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await Billing.create({
      userId,
      amount: plan.amount,
      interviewCoins: plan.interviewCoins,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(201).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const razorpayError = error.error || {};
    const providerMessage = razorpayError.description || razorpayError.reason;
    if (providerMessage || error.statusCode) {
      const diagnostic = providerMessage || error.message || "The provider rejected the request.";
      console.error("Razorpay order creation rejected:", error.statusCode || "unknown status", razorpayError.code || "unknown code", diagnostic);
      return res.status(502).json({
        success: false,
        message: `Razorpay rejected the order${razorpayError.code ? ` (${razorpayError.code})` : ""}: ${diagnostic}`,
      });
    }

    console.error("Order creation failed outside Razorpay:", error.message);
    return res.status(500).json({
      success: false,
      message: "The order could not be saved. Check billing database connectivity and the billing service log.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const sessionId = req.headers["x-session-id"];
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body ?? {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Sign in before verifying a payment." });
    }

    if (
      typeof orderId !== "string" || !orderId ||
      typeof paymentId !== "string" || !paymentId ||
      typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(400).json({ success: false, message: "Payment details are incomplete." });
    }

    const payment = await Billing.findOne({ razorpayOrderId: orderId });
    if (!payment || String(payment.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: "Payment order not found for this account." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(String(signature));

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    if (payment.status !== "paid") {
      const razorpayPayment = await razorpay.payments.fetch(paymentId);
      if (razorpayPayment.order_id !== orderId || razorpayPayment.status !== "captured") {
        return res.status(402).json({ success: false, message: "Payment has not been captured yet." });
      }
    }

    // Idempotency: if already paid, just return current session coin balance
    if (payment.status === "paid") {
      const sessionRaw = sessionId ? await redis.get(`session:${sessionId}`) : null;
      const currentCoins = sessionRaw ? JSON.parse(sessionRaw).interviewCoin : 0;
      return res.status(200).json({ success: true, message: "Payment already verified.", interviewCoin: currentCoins });
    }

    // Mark order paid
    payment.status = "paid";
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;
    await payment.save();

    // Update Redis session with new coin balance
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session missing. Please sign in and retry." });
    }

    const sessionRaw = await redis.get(`session:${sessionId}`);
    if (!sessionRaw) {
      return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
    }

    const sessionData = JSON.parse(sessionRaw);
    const newCoinBalance = (Number(sessionData.interviewCoin) || 0) + payment.interviewCoins;
    sessionData.interviewCoin = newCoinBalance;

    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), "EX", 60 * 60 * 24 * 7);

    return res.status(200).json({
      success: true,
      message: "Payment successful. Coins added to your account.",
      interviewCoin: newCoinBalance,
    });
  } catch (error) {
    console.error("Razorpay payment verification failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not verify payment. If money was deducted, retry from your purchase page.",
    });
  }
};
