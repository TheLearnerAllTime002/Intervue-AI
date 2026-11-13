import api from "../utils/axios"
import { createFirebaseBackendLogin, createSessionRestorer } from "./sessionRestore"

export const getCurrentUser = async () => {
    const response = await api.get("/api/me")
    return response.data
}

export const restoreBackendSession = createSessionRestorer({
    getCurrentUser,
    loginWithFirebaseUser: createFirebaseBackendLogin(api),
})

export const establishBackendSession = restoreBackendSession.establish

export const spendCoins = async (data)=>{
    const response = await api.post("/api/auth/use-coins" , data)
    return response.data
}

export const getCoinHistory = async () => {
    const response = await api.get("/api/billing/history")
    return response.data
}
