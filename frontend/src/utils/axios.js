import axios from "axios";
import { installApiResilience } from "./apiResilience";


const api = axios.create({
    baseURL: import.meta.env.PROD ? "" : import.meta.env.VITE_BACKEND_URL,
    withCredentials:true
})

installApiResilience(api);

export default api
