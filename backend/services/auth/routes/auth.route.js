import express from "express";
import { getCoinHistory, login, logout, useInterviewCoins } from "../controllers/auth.controller.js";




const authRouter = express.Router();

authRouter.post("/login",login);

authRouter.get("/logout",logout)

authRouter.post(
  "/use-coins",
  useInterviewCoins
);
authRouter.get("/coin-history", getCoinHistory);

export default authRouter;
