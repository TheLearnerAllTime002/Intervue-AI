import { HumanMessage } from "@langchain/core/messages"
import llm from "../config/llm.js"

export const coverLetterAgent = async ({ resumeText, jobDescription, company = "", role = "", tone = "professional", length = "standard" }) => {
    const wordTarget = length === "concise" ? "150–200" : length === "detailed" ? "350–420" : "250–320"
    const toneGuide = tone === "enthusiastic"
        ? "warm, enthusiastic, and energetic — show genuine excitement for the role"
        : tone === "formal"
            ? "formal and conservative — traditional business letter style"
            : "professional yet personable — confident without being stiff"

    const response = await llm.invoke([
        new HumanMessage(`You are an expert career coach writing a cover letter on behalf of a job applicant.

STRICT RULES:
- Use ONLY facts present in the resume. Never invent employers, dates, degrees, metrics, or skills.
- Do not include placeholder text like [Your Name] or [Date]. Use the candidate's actual name from the resume.
- If no hiring manager name is available, use "Hiring Manager".
- Tone: ${toneGuide}.
- Length: approximately ${wordTarget} words.
- Structure: opening hook → 1-2 body paragraphs connecting resume evidence to job requirements → closing with call to action.
- Return ONLY valid JSON, no markdown, no extra text.

JSON shape:
{
  "coverLetter": "Complete cover letter as plain text with line breaks using \\n",
  "subject": "Suggested email subject line"
}

ROLE: ${role.slice(0, 160) || "Infer from job description"}
COMPANY: ${company.slice(0, 160) || "Not specified"}
TONE: ${tone}

RESUME:
${resumeText.slice(0, 14000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 10000)}`),
    ], {
        response_format: { type: "json_object" },
        max_tokens: 1200,
    })

    const content = Array.isArray(response.content)
        ? response.content.map((p) => p.text || "").join("")
        : response.content

    const cleaned = String(content).replace(/```json|```/g, "").trim()
    const result = JSON.parse(cleaned)

    if (typeof result?.coverLetter !== "string" || result.coverLetter.trim().length < 50) {
        throw new Error("The cover letter generator returned an incomplete response.")
    }

    return {
        coverLetter: result.coverLetter.trim(),
        subject: typeof result.subject === "string" ? result.subject.trim() : `Application for ${role || "the role"} at ${company || "your company"}`,
    }
}
