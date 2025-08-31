import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  selectedUser: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await axiosInstance.get("/auth/users");
      set({ users: response.data });
    } catch (error) {
      toast.error(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (receiver_id) => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/messages/${receiver_id}`);
      set({ messages: response.data });
    } catch (error) {
      toast.error(error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const formData = new FormData();
      if (messageData.text) formData.append("content", messageData.text);
      if (messageData.image) {
        formData.append("img_file", messageData.image);
      }
      const response = await axiosInstance.post(
        `/messages/send/${selectedUser.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ messages: [...messages, response.data] });
    } catch (error) {
      console.log(error);
      toast.error(error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.sender_id === selectedUser.id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  
  
}));
