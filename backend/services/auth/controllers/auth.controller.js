import { getAuth } from "firebase-admin/auth";
import { app } from "../configs/firebase.js";
import User from "../model/user.model.js";
import { getRedisClient } from "../../../shared/redis/redis.js";
import { SESSION_TTL_SECONDS } from "../../../shared/sessionConfig.js";
import { createLoginHandler, createLogoutHandler, isDependencyUnavailable } from "./loginHandler.js";

const redis = getRedisClient("auth");

const COIN_ACTIONS = {
  "resume-scorer": { coins: 10 },
  "start-interview": { coins: 50 },
  "roadmap-builder": { coins: 20 },
  "download-pdf": { coins: 10 },
  "cover-letter": { coins: 20 },
};

export const login = createLoginHandler({
  verifyIdToken: (token) => getAuth(app).verifyIdToken(token),
  User,
  redis,
});

export const logout = createLogoutHandler({ redis });
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
    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), "EX", SESSION_TTL_SECONDS);

    return res.status(200).json({
      success: true,
      message: "Interview coins updated successfully",
      action,
      interviewCoin: newBalance,
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "AUTH_COIN_UPDATE_FAILURE", requestId: req.requestId || "unknown", code: error?.code || error?.name || "unknown" }));
    return res.status(isDependencyUnavailable(error) ? 503 : 500).json({
      success: false,
      message: isDependencyUnavailable(error) ? "Session service is temporarily unavailable. Please try again shortly." : "Could not update interview coins.",
    });
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
    console.error(JSON.stringify({ event: "AUTH_COIN_HISTORY_FAILURE", requestId: req.requestId || "unknown", code: error?.code || error?.name || "unknown" }));
    return res.status(isDependencyUnavailable(error) ? 503 : 500).json({
      success: false,
      message: isDependencyUnavailable(error) ? "Session service is temporarily unavailable. Please try again shortly." : "Could not load coin history.",
    });
  }
};
