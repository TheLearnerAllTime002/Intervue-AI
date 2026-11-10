import express from "express"
import dotenv from "dotenv"
dotenv.config()
if (process.env.NODE_ENV === "production" && !process.env.INTERNAL_SERVICE_SECRET) {
    throw new Error("INTERNAL_SERVICE_SECRET is required in production");
}
import proxy from "express-http-proxy"
import cors from "cors"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import { isAuth } from "./middleware/isAuth.js"
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js"
import { sendContactMessage } from "./controllers/contact.controller.js"
const app = express()

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))

app.use(morgan("dev"))
app.use(cookieParser())

const PORT = process.env.PORT || 8000

// Reload the configured Redis endpoint from the gateway environment on restart.

app.get("/" , (req,res)=>{
    res.send("Hello from Gateway")
})


app.use("/api/auth" , proxy(process.env.AUTH_SERVICE_URL, {
    parseReqBody: false,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (srcReq.cookies?.session) {
            proxyReqOpts.headers["cookie"] = `session=${srcReq.cookies.session}`
        }
        return proxyReqOpts
    }
}))
app.use("/api/resume" ,isAuth, proxyWithHeaders(process.env.RESUME_SERVICE_URL))
app.use("/api/interview",isAuth ,proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL))
app.use("/api/roadmap",isAuth ,proxyWithHeaders(process.env.ROADMAP_SERVICE_URL))
app.use("/api/billing",isAuth ,proxyWithHeaders(process.env.BILLING_SERVICE_URL))
app.get("/api/me",isAuth,getCurrentUser)

// Keep body parsing after proxy routes. The proxy must read the original
// request stream so JSON bodies (including the Firebase token on login) are
// forwarded to their service correctly.
app.use(express.json())

app.post("/api/contact", sendContactMessage)




app.listen(PORT , ()=>{
    console.log(`Gateway Started on ${PORT}`)
})
