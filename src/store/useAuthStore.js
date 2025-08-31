import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "https://chat-app-backend-o74g.onrender.com"; // Replace with your server URL

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });
      get().connectSocket();
    } catch (error) {
      console.error("Error checking auth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/register", data);
      set({ authUser: response.data });
      toast.success("Account Created Successfully");
      get().connectSocket();
    } catch (err) {
      console.log(err);
      toast.error(err.response.data.detail[0].msg);
    } finally {
      set({ isSigningUp: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged Out Successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.detail[0].msg);
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data });
      toast.success("Logged In Successfully");
      get().connectSocket();
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.detail);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  updateProfile: async (formData) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await axiosInstance.put(
        "/auth/update-profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      set({ authUser: response.data });
      toast.success("Profile Updated Successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: async () => {
  const { authUser } = get();
  if (!authUser || get().socket?.connected) return;
  
  const socket = io(BASE_URL, {
    transports: ["websocket", "polling"], 
    withCredentials: true,
    auth: {
      token: authUser?.token 
    }, query : {
      userId : authUser.id
    }
  });
  
  socket.connect();
  
  // Add event listeners
  socket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });
  
  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });
  
  // Store socket in your state
  set({ socket:socket });
},
  disconnectSocket: async () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
  },
}));
