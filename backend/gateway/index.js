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

const getServiceUrl = (name) => {
    const value = process.env[name]?.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "")
    if (!value) {
        throw new Error(`${name} is missing from the gateway environment`)
    }
    return value
}

const frontendOrigin = process.env.FRONTEND_URL?.replace(/\/+$/, "")
const authServiceUrl = getServiceUrl("AUTH_SERVICE_URL")
const resumeServiceUrl = getServiceUrl("RESUME_SERVICE_URL")
const interviewServiceUrl = getServiceUrl("INTERVIEW_SERVICE_URL")
const roadmapServiceUrl = getServiceUrl("ROADMAP_SERVICE_URL")
const billingServiceUrl = getServiceUrl("BILLING_SERVICE_URL")

app.use(cors({
    origin: frontendOrigin,
    credentials:true
}))

app.use(morgan("dev"))
app.use(cookieParser())

const PORT = process.env.PORT || 8000

// Reload the configured Redis endpoint from the gateway environment on restart.

app.get("/" , (req,res)=>{
    res.send("Hello from Gateway")
})


app.use("/api/auth" , proxy(authServiceUrl, {
    parseReqBody: false,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (srcReq.cookies?.session) {
            proxyReqOpts.headers["cookie"] = `session=${srcReq.cookies.session}`
        }
        return proxyReqOpts
    }
}))
app.use("/api/resume" ,isAuth, proxyWithHeaders(resumeServiceUrl))
app.use("/api/interview",isAuth ,proxyWithHeaders(interviewServiceUrl))
app.use("/api/roadmap",isAuth ,proxyWithHeaders(roadmapServiceUrl))
app.use("/api/billing",isAuth ,proxyWithHeaders(billingServiceUrl))
app.get("/api/me",isAuth,getCurrentUser)

// Keep body parsing after proxy routes. The proxy must read the original
// request stream so JSON bodies (including the Firebase token on login) are
// forwarded to their service correctly.
app.use(express.json())

app.post("/api/contact", sendContactMessage)




app.listen(PORT , ()=>{
    console.log(`Gateway Started on ${PORT}`)
})
