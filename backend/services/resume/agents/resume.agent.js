import { HumanMessage } from "@langchain/core/messages"
import llm from "../config/llm.js"

const formatEntry = (entry, field) => {
    if (typeof entry === "string") return entry.trim()
    if (entry === null || entry === undefined) return ""
    if (typeof entry !== "object") return String(entry)

    if (field === "education") {
        return [
            entry.degree || entry.qualification || entry.program,
            entry.institution || entry.school || entry.university,
            entry.details || entry.percentage || entry.grade || entry.year,
        ].filter(Boolean).join(" — ")
    }
    if (field === "projects") {
        const technologies = Array.isArray(entry.technologies) ? entry.technologies.join(", ") : entry.technologies
        return [entry.title || entry.name, technologies, entry.description || entry.details].filter(Boolean).join(" — ")
    }
    if (field === "experience") {
        const responsibilities = Array.isArray(entry.responsibilities) ? entry.responsibilities.join("; ") : entry.responsibilities
        return [entry.position || entry.role || entry.title, entry.company || entry.employer, entry.duration || entry.dates, entry.description || responsibilities || entry.details].filter(Boolean).join(" — ")
    }
    return Object.values(entry).map((value) => Array.isArray(value) ? value.join(", ") : value).filter((value) => typeof value === "string" || typeof value === "number").join(" — ")
}

const parseLooseArray = (value) => {
    const source = value.trim()
    try {
        const parsed = JSON.parse(source)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        // Some model responses stringify a JavaScript-style array instead of
        // returning the required JSON array. Recover simple quoted fields.
        const objects = [...source.matchAll(/\{([\s\S]*?)\}/g)].map(([, body]) => {
            const object = {}
            const fieldPattern = /([\w-]+)\s*:\s*(?:'((?:\\.|[^'])*)'|"((?:\\.|[^"])*)"|(\[[^\]]*\]))/g
            for (const [, key, singleQuoted, doubleQuoted, arrayValue] of body.matchAll(fieldPattern)) {
                if (arrayValue) {
                    object[key] = [...arrayValue.matchAll(/['"]([^'"]*)['"]/g)].map((match) => match[1])
                } else {
                    object[key] = (singleQuoted ?? doubleQuoted ?? "").replace(/\\(['"\\])/g, "$1")
                }
            }
            return object
        }).filter((object) => Object.keys(object).length)
        return objects.length ? objects : [source]
    }
}

const normalizeStringList = (value, field) => {
    const entries = Array.isArray(value)
        ? value
        : typeof value === "string" && value.trim().startsWith("[")
            ? parseLooseArray(value)
            : value === null || value === undefined || value === ""
                ? []
                : [value]
    return entries.map((entry) => formatEntry(entry, field)).filter(Boolean).slice(0, 100)
}

const normalizeResumeData = (data) => {
    const normalized = { ...data }
    for (const field of ["skills", "projects", "education", "experience", "strengths", "weaknesses", "missingSkills", "recommendations"]) {
        normalized[field] = normalizeStringList(data[field], field)
    }
    for (const field of ["name", "email", "phone", "summary", "suggestedRole"]) {
        if (typeof normalized[field] !== "string") normalized[field] = ""
    }
    const score = Number(normalized.score)
    normalized.score = Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0
    return normalized
}

export const resumeAgent = async (resumeText) => {
    const response = await llm.invoke([
        new HumanMessage(`
You are an Expert ATS Resume Analyzer.

Analyze the given resume.

Extract the following information:

- Full Name
- Email
- Phone Number
- Professional Summary
- Technical Skills
- Projects
- Education
- Experience
- Strengths
- Weaknesses
- Missing Skills
- Suggested Job Role
- ATS Score (0-100)
- Recommendations

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Do not use markdown.
3. Do not explain anything.
4. Do not add extra text.
5. Every field must exist.
6. skills, projects, education, experience, strengths, weaknesses, missingSkills, and recommendations MUST each be JSON arrays of plain strings. Do not return objects or a string containing an array for these fields.

Response Format:

{
  "name":"",
  "email":"",
  "phone":"",
  "summary":"",
  "skills":[],
  "projects":[],
  "education":[],
  "experience":[],
  "strengths":[],
  "weaknesses":[],
  "missingSkills":[],
  "suggestedRole":"",
  "score":0,
  "recommendations":[]
}
\nResume text:\n${resumeText}`),
    ], {
        response_format: { type: "json_object" },
        maxTokens: 2500,
    })

    const content = Array.isArray(response.content)
        ? response.content.map((part) => part.text || "").join("")
        : response.content
    if (typeof content !== "string" || !content.trim()) {
        throw new Error("The resume analyzer returned an empty response.")
    }

    const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim()
    let data
    try {
        data = JSON.parse(cleaned)
    } catch (error) {
        const start = cleaned.indexOf("{")
        const end = cleaned.lastIndexOf("}")
        if (start < 0 || end <= start) {
            throw new Error(`The resume analyzer returned invalid JSON: ${error.message}`)
        }
        try {
            data = JSON.parse(cleaned.slice(start, end + 1))
        } catch {
            throw new Error(`The resume analyzer returned invalid JSON: ${error.message}`)
        }
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("The resume analyzer returned invalid data.")
    }
    return normalizeResumeData(data)
}
