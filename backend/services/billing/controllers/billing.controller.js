import crypto from "crypto";
import razorpay from "../configs/razorpay.js";
import Billing from "../models/billing.model.js";
import User from "../models/user.model.js";
import { getRedisClient } from "../../../shared/redis/redis.js";
import { SESSION_TTL_SECONDS } from "../../../shared/sessionConfig.js";

const redis = getRedisClient("billing");

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

    // Idempotency: paid orders return the durable user balance.
    if (payment.status === "paid") {
      const user = await User.findById(userId).select("interviewCoin");
      const currentCoins = user?.interviewCoin ?? 0;
      return res.status(200).json({ success: true, message: "Payment already verified.", interviewCoin: currentCoins });
    }

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session missing. Please sign in and retry." });
    }

    const purchaseEntry = {
      kind: "purchase",
      action: "coin-purchase",
      coins: payment.interviewCoins,
      createdAt: new Date(),
      referenceId: orderId,
    };
    let user = await User.findOneAndUpdate(
      { _id: userId, processedBillingOrderIds: { $ne: orderId } },
      {
        $inc: { interviewCoin: payment.interviewCoins },
        $push: { coinHistory: { $each: [purchaseEntry], $slice: -100 } },
        $addToSet: { processedBillingOrderIds: orderId },
      },
      { new: true }
    );

    if (!user) user = await User.findById(userId).select("interviewCoin");
    if (!user) return res.status(404).json({ success: false, message: "Account not found for this payment." });

    payment.status = "paid";
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;
    await payment.save();

    const newCoinBalance = Number(user.interviewCoin) || 0;
    try {
      const sessionRaw = await redis.get(`session:${sessionId}`);
      if (sessionRaw) {
        const sessionData = JSON.parse(sessionRaw);
        sessionData.interviewCoin = newCoinBalance;
        sessionData.coinPersistenceVersion = 1;
        await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), "EX", SESSION_TTL_SECONDS);
      }
    } catch (sessionError) {
      console.error("Could not refresh the billing session balance:", sessionError.code || sessionError.name || "unknown");
    }

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

export const getBillingHistory = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ success: false, message: "Please sign in again." });

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    // If a user still has a session created before coin persistence was added,
    // preserve its latest balance and usage history before reconciling purchases.
    const sessionId = req.headers["x-session-id"];
    const sessionRaw = sessionId ? await redis.get(`session:${sessionId}`) : null;
    if (!user.coinLedgerInitialized && sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session.coinPersistenceVersion !== 1) {
        user = await User.findOneAndUpdate(
          { _id: userId, coinLedgerInitialized: { $ne: true } },
          {
            $set: {
              interviewCoin: Number(session.interviewCoin) || 0,
              coinHistory: session.coinHistory || [],
              coinLedgerInitialized: true,
            },
          },
          { new: true }
        ) || user;
      }
    }

    if (!user.coinLedgerInitialized) {
      const paidOrders = await Billing.find({ userId, status: "paid" }).sort({ updatedAt: 1 });
      for (const order of paidOrders) {
        await User.findOneAndUpdate(
          { _id: userId, processedBillingOrderIds: { $ne: order.razorpayOrderId } },
          {
            $inc: { interviewCoin: order.interviewCoins },
            $push: {
              coinHistory: {
                $each: [{ kind: "purchase", action: "coin-purchase", coins: order.interviewCoins, createdAt: order.updatedAt || order.createdAt, referenceId: order.razorpayOrderId }],
                $slice: -100,
              },
            },
            $addToSet: { processedBillingOrderIds: order.razorpayOrderId },
          }
        );
      }
      user = await User.findByIdAndUpdate(userId, { $set: { coinLedgerInitialized: true } }, { new: true });
    }

    const [latestUser, paidOrders] = await Promise.all([
      User.findById(userId).select("interviewCoin coinHistory").lean(),
      Billing.find({ userId, status: "paid" }).select("interviewCoins razorpayOrderId createdAt updatedAt").lean(),
    ]);
    const transactions = [...(latestUser?.coinHistory || [])];
    const knownPurchases = new Set(transactions.map((entry) => entry.referenceId).filter(Boolean));
    for (const order of paidOrders) {
      if (order.razorpayOrderId && !knownPurchases.has(order.razorpayOrderId)) {
        transactions.push({
          kind: "purchase",
          action: "coin-purchase",
          coins: order.interviewCoins,
          createdAt: order.updatedAt || order.createdAt,
          referenceId: order.razorpayOrderId,
        });
      }
    }
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({
      success: true,
      interviewCoin: latestUser?.interviewCoin ?? 0,
      transactions: transactions.slice(0, 100),
    });
  } catch (error) {
    console.error("Could not load billing history:", error.code || error.name || "unknown");
    return res.status(500).json({ success: false, message: "Could not load coin history." });
  }
};
