import api from "../utils/axios"

export const getResume = async () => {
    try {
        const response = await api.get("/api/resume/get-resume")
        return response.data
    } catch {
        return null
    }
}

export const generateCoverLetter = async (payload) => {
    const response = await api.post("/api/resume/cover-letter", payload)
    return response.data
}

export const getCoverLetterHistory = async () => {
    const response = await api.get("/api/resume/cover-letter/history")
    return response.data
}