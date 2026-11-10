import "dotenv/config"
import express from "express"
import { connectDB } from "./config/db.js"
import resumeRouter from "./routes/resume.route.js"
import { requireGateway } from "../../shared/serviceAuth.js"

const app = express()

app.use(express.json())
app.use(requireGateway)


// The gateway's default RESUME_SERVICE_URL targets port 8002.
const PORT = process.env.PORT || 8002

// Reload MongoDB and Redis endpoints from this service's local environment on restart.

app.get("/" , (req,res)=>{
    res.send("Hello from Resume-service")
})

app.use("/",resumeRouter)



const start = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => {
            console.log(`Resume-service Started on ${PORT}`)
        })
    } catch (error) {
        console.error("Resume service could not connect to MongoDB:", error)
        process.exit(1)
    }
}

start()
