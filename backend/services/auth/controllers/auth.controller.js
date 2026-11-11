import crypto from "crypto";

import { getAuth } from "firebase-admin/auth";


import { app } from "../configs/firebase.js";
import User from "../model/user.model.js";
import  redis from "../../../shared/redis/redis.js";

const COIN_ACTIONS = {
  "resume-scorer": { coins: 10 },
  "start-interview": { coins: 50 },
  "roadmap-builder": { coins: 20 },
  "download-pdf": { coins: 10 },
  "cover-letter": { coins: 20 },
};

const getSessionCookieOptions = (req) => {
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps =
    process.env.NODE_ENV === "production" ||
    forwardedProtocol === "https" ||
    req.protocol === "https";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
};


export const login = async (req, res) => {

  try {

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    const decoded = await getAuth(app).verifyIdToken(token);

    let user = await User.findOne({
      $or: [
        { firebaseUid: decoded.uid },
        { email: decoded.email },
      ],
    });

    if (!user) {

      user = await User.create({

        firebaseUid: decoded.uid,

        email: decoded.email,

        name: decoded.name

      });
    } else if (user.firebaseUid !== decoded.uid) {
      // The email was verified by Firebase. Re-linking the existing record
      // prevents duplicate-key failures after an account/provider migration.
      user.firebaseUid = decoded.uid;
      user.name = decoded.name || user.name;
      await user.save();
    }

    const sessionId =crypto.randomUUID();

    await redis.set(`session:${sessionId}`, JSON.stringify({
        userId:
        user._id,

        name:
        user.name,

        email:
        user.email,

        interviewCoin:
        user.interviewCoin

      }),"EX", 60 * 60 * 24 * 7);

    res.cookie("session", sessionId, getSessionCookieOptions(req));

    return res.json({ success:true,user});

  } catch (error) {
    const providerUnavailable = /\b(EACCES|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN)\b/i.test(
      `${error?.message || ""} ${error?.cause?.code || ""}`
    );

    console.error("Firebase sign-in verification failed:", error?.code || "unknown", error?.message);
    return res.status(providerUnavailable ? 503 : 401).json({
      message: providerUnavailable
        ? "Sign-in verification is temporarily unavailable. Please try again shortly."
        : "Unable to verify the sign-in token. Please sign in again.",
    });

  }

};

export const logout = async (req, res) => {
  try {

    const sessionId = req.cookies?.session;

    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie("session", cookieOptions);

    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const useInterviewCoins = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
      return res.status(401).json({ success: false, message: "Please sign in again" });
    }

    const sessionRaw = await redis.get(`session:${sessionId}`);
    if (!sessionRaw) {
      return res.status(401).json({ success: false, message: "Session expired. Please sign in again" });
    }

    const sessionData = JSON.parse(sessionRaw);
    const { coins, action } = req.body ?? {};
    const coinAction = COIN_ACTIONS[action];

    if (!coinAction || !Number.isInteger(coins) || coins !== coinAction.coins) {
      return res.status(400).json({ success: false, message: "Choose a valid coin action and cost." });
    }

    const currentCoins = Number(sessionData.interviewCoin) || 0;
    if (currentCoins < coinAction.coins) {
      return res.status(403).json({
        success: false,
        message: "Not enough interview coins",
        interviewCoin: currentCoins,
      });
    }

    const newBalance = currentCoins - coinAction.coins;
    sessionData.interviewCoin = newBalance;
    const historyEntry = { kind: "usage", action, coins: coinAction.coins, createdAt: new Date().toISOString() };
    sessionData.coinHistory = [...(sessionData.coinHistory || []).slice(-99), historyEntry];
    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), "EX", 60 * 60 * 24 * 7);

    return res.status(200).json({
      success: true,
      message: "Interview coins updated successfully",
      action,
      interviewCoin: newBalance,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoinHistory = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    if (!sessionId) return res.status(401).json({ success: false, message: "Please sign in again." });

    const sessionRaw = await redis.get(`session:${sessionId}`);
    if (!sessionRaw) return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });

    const sessionData = JSON.parse(sessionRaw);
    return res.status(200).json({
      success: true,
      interviewCoin: sessionData.interviewCoin ?? 0,
      transactions: sessionData.coinHistory ?? [],
    });
  } catch (error) {
    console.error("Could not load coin history:", error.message);
    return res.status(500).json({ success: false, message: "Could not load coin history." });
  }
};
