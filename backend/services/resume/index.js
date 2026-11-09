import "dotenv/config"
import express from "express"
import { connectDB } from "./config/db.js"
import resumeRouter from "./routes/resume.route.js"

const app = express()

app.use(express.json())


const PORT = process.env.PORT || 6002

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
