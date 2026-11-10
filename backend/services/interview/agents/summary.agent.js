import llm from "../config/llm.js";
import summaryPrompt from "../prompts/summaryPrompt.js";

export const summaryAgent = async (data) => {

    try {
        const prompt = summaryPrompt(data)

        const response = await llm.invoke(prompt, {
            response_format: { type: "json_object" },
            reasoning_format: "hidden",
            max_tokens: 1600,
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
        console.error("Summary agent failed:", error.message)
        throw new Error(`Failed to generate interview summary: ${error.message}`, { cause: error })
        
    }
}
