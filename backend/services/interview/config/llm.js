
import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
})

const apiKey = process.env.GROQ_API_KEY
if (!apiKey || apiKey === "your_groq_api_key") {
    throw new Error("GROQ_API_KEY is missing or still uses the placeholder value in services/interview/.env")
}

const llm = new ChatGroq({
    apiKey,
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    reasoningEffort: "low",
    timeout: 90000,
    maxRetries: 0,
})

export default llm
