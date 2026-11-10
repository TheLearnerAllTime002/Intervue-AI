import "dotenv/config"
import express from "express"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { connectDB } from "./config/db.js"
import interviewRouter from "./routes/interview.route.js"
import { requireGateway } from "../../shared/serviceAuth.js"
dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), ".env"),
})

const app = express()

app.use(express.json())
app.use(requireGateway)

const PORT = process.env.PORT || 8003

// Reload MongoDB and Redis endpoints from this service's local environment on restart.

app.get("/" , (req,res)=>{
    res.send("Hello from Interview-service")
})


app.use("/",interviewRouter)


const start = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => console.log(`Interview-service Started on ${PORT}`))
    } catch (error) {
        console.error("Interview service startup failed:", error.message)
        process.exit(1)
    }
}

start()
