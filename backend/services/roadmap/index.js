import "dotenv/config"
import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./configs/db.js"
import roadmapRouter from "./routes/roadmap.route.js"
import { requireGateway } from "../../shared/serviceAuth.js"
dotenv.config()

const app = express()
app.use(express.json())
app.use(requireGateway)

const PORT = process.env.PORT || 8004

// Reload MongoDB and Redis endpoints from this service's local environment on restart.

app.use("/",roadmapRouter)

const start = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => console.log(`Roadmap-service Started on ${PORT}`))
    } catch (error) {
        console.error("Roadmap service startup failed:", error.message)
        process.exit(1)
    }
}

start()
