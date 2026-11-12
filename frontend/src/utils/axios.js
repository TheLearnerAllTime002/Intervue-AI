import axios from "axios";
import { auth } from "./firebase";
import { installApiResilience } from "./apiResilience";


const api = axios.create({
    baseURL: import.meta.env.PROD ? "" : import.meta.env.VITE_BACKEND_URL,
    withCredentials:true
})

installApiResilience(api, auth);

export default api
