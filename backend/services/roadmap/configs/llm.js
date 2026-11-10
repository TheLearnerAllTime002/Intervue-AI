import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
})

const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    maxTokens: 4000,
    maxRetries: 2,
})

export default llm
