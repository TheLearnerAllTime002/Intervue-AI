import api from "../utils/axios"


export const startInterview = async (data) => {
    const response = await api.post("/api/interview/start", data)
    return response.data
}

export const getInterview = async (id) => {
    const response = await api.get(`/api/interview/${id}`)
    return response.data
}


export const submitAnswer = async (data) => {
    const response = await api.post(`/api/interview/answer`, data)
    return response.data
}

export const getAllInterviews = async () => {
    const response = await api.get(`/api/interview/all`)
    return response.data
}

export const deleteInterview = async (id) => {
    const response = await api.delete(`/api/interview/${id}`)
    return response.data
}

export const getPeerBenchmark = async () => {
    const response = await api.get("/api/interview/benchmark")
    return response.data
}

export const getQuestionBanks = async () => {
    const response = await api.get("/api/interview/banks")
    return response.data
}

export const createQuestionBank = async (data) => {
    const response = await api.post("/api/interview/banks", data)
    return response.data
}

export const addBankQuestion = async (id, data) => {
    const response = await api.post(`/api/interview/banks/${id}/questions`, data)
    return response.data
}

export const deleteBankQuestion = async (id, questionId) => {
    const response = await api.delete(`/api/interview/banks/${id}/questions/${questionId}`)
    return response.data
}

export const deleteQuestionBank = async (id) => {
    const response = await api.delete(`/api/interview/banks/${id}`)
    return response.data
}
