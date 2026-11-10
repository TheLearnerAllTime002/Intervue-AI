import llm from "../config/llm.js";
import feedbackPrompt from "../prompts/feedbackPrompt.js";





export const feedbackAgent = async (data) => {

    try {
        const prompt = feedbackPrompt(data)

        const response = await llm.invoke(prompt, {
            response_format: { type: "json_object" },
            reasoning_format: "hidden",
            max_tokens: 900,
        })

        const content = Array.isArray(response.content)
            ? response.content.map((part) => part.text || "").join("")
            : response.content
        const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

        const parsed = JSON.parse(cleaned)
        if (!parsed?.feedback || typeof parsed.feedback.feedback !== "string") {
            throw new Error("The model returned incomplete feedback.")
        }
        return parsed
    } catch (error) {
        console.error("Feedback agent failed:", error.message)
        throw new Error(`Failed to generate interview feedback: ${error.message}`, { cause: error })
        
    }
}
