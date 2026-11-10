import llm from "../config/llm.js"
import hrInterviewPrompt from "../prompts/hrInterviewPrompt.js"
import technicalInterviewPrompt from "../prompts/technicalInterviewPrompt.js"



export const interviewAgent = async (data) => {

    try {
        const prompt = data.type?.toLowerCase() === "hr" ? hrInterviewPrompt(data) : technicalInterviewPrompt(data)

        const response = await llm.invoke(prompt, {
            response_format: { type: "json_object" },
            reasoning_format: "hidden",
            max_tokens: 5000,
        })

        const content = Array.isArray(response.content)
            ? response.content.map((part) => part.text || "").join("")
            : response.content
        const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

        return JSON.parse(cleaned)
    } catch (error) {
        console.error("Interview agent failed:", error.message)
        throw new Error(`Failed to generate interview questions: ${error.message}`, { cause: error })
        
    }
}
