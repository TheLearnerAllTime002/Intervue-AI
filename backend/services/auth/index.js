import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { connectDb } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";


const app = express();

app.use(express.json());

app.use(cookieParser());

// Keep the local default aligned with the gateway AUTH_SERVICE_URL and the
// auth service Dockerfile, which both use port 8001.
const PORT = process.env.PORT || 8001

app.use("/",authRouter);



const start = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Auth Service Started on ${PORT}`);
    });
  } catch (error) {
    console.error("Auth service could not connect to MongoDB:", error);
    process.exit(1);
  }
};

start();
