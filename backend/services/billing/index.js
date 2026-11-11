import "dotenv/config"
import express from "express"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { connectDB } from "./configs/db.js"
import billingRouter from "./routes/billing.route.js"
import { requireGateway } from "../../shared/serviceAuth.js"

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) })

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 8005

// Reload MongoDB and Redis endpoints from this service's local environment on restart.

app.get("/",(req,res)=>{
    res.send("Hello from Billing-service")
})

app.use(requireGateway)
app.use("/",billingRouter)

const start = async () => {
    await connectDB()
    app.listen(PORT, () => {
        console.log(`Billing-service Started on ${PORT}`)
    })
}

start().catch((error) => {
    console.error("Billing service startup failed:", error.message)
    process.exit(1)
})
