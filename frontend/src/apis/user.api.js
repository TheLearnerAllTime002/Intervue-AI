import api from "../utils/axios"

export const getCurrentUser = async () => {
    try {
        const response = await api.get("/api/me")
        return response.data
    } catch {
        return null
    }
}

export const spendCoins = async (data)=>{
    const response = await api.post("/api/auth/use-coins" , data)
    return response.data
}

export const getCoinHistory = async () => {
    const response = await api.get("/api/auth/coin-history")
    return response.data
}
