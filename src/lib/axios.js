import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "https://chat-app-backend-o74g.onrender.com/",
    withCredentials: true
})

export default axiosInstance;
