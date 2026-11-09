import crypto from "crypto";

import { getAuth } from "firebase-admin/auth";


import { app } from "../configs/firebase.js";
import User from "../model/user.model.js";
import  redis from "../../../shared/redis/redis.js";

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
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

    res.cookie("session", sessionId, sessionCookieOptions);

    return res.json({ success:true,user});

  } catch (error) {
console.log(error)
    return res.status(401).json({ message: error.message, });

  }

};

export const logout = async (req, res) => {
  try {

    const sessionId = req.cookies?.session;

    res.clearCookie("session", {
      httpOnly: sessionCookieOptions.httpOnly,
      secure: sessionCookieOptions.secure,
      sameSite: sessionCookieOptions.sameSite,
    });

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
    return res.status(401).json({
      success: false,
      message: "Please sign in again",
    });
  }

  const session = await redis.get(`session:${sessionId}`)

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please sign in again",
    });
  }

  const sessionData = JSON.parse(session);

    const { coins, action } = req.body;

    if (!coins) {
      return res.status(400).json({ 
        success: false,
        message: "Coins are required",
      });
    }

    const user = await User.findById(sessionData.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Not enough coins
    if (user.interviewCoin < coins) {
      return res.status(403).json({
        success: false,
        message: "Not enough interview coins",
        interviewCoin: user.interviewCoin,
      });
    }

    // Deduct coins
    user.interviewCoin -= coins;

    await user.save();
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


    return res.status(200).json({
      success: true,
      message: "Interview coins updated successfully",
      action,
      interviewCoin: user.interviewCoin,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};




export const addCoins = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    const session = await redis.get(`session:${sessionId}`);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    const sessionData = JSON.parse(session);

    const { coins } = req.body;

    if (!coins || coins <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid coins are required",
      });
    }

    const user = await User.findById(sessionData.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.interviewCoin += Number(coins);

    await user.save();

    // Update Redis Session
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        interviewCoin: user.interviewCoin,
      }),
      "EX",
      60 * 60 * 24 * 7
    );

    return res.status(200).json({
      success: true,
      message: "Coins added successfully",
      interviewCoin: user.interviewCoin,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
