import { create } from "zustand";
import { persist } from "zustand/middleware";
import { endpoints } from "../config/axios";
import toast from "react-hot-toast";
import { Message } from "../types/messages.types";

interface MessageState {
    messages: Message[];
    isLoading: boolean;
    fetchMessages: () => Promise<Message[]>;
    deleteMessage: (id: number) => Promise<void>;
}

export const useMessages = create<MessageState>()(
    persist(
        (set, get) => ({
            messages: [],
            isLoading: false,
            fetchMessages: async () => {
                try {
                    set({ isLoading: true });
                    const response = await endpoints.messages.get();
                    
                    // Handle different possible response structures
                    let messagesData = [];
                    if (response.data) {
                        // Check if response.data is an array
                        if (Array.isArray(response.data)) {
                            messagesData = response.data;
                        } 
                        // Check if response.data has a messages property that is an array
                        else if (response.data.messages && Array.isArray(response.data.messages)) {
                            messagesData = response.data.messages;
                        }
                        // Check if response.data has a data property that is an array
                        else if (response.data.data && Array.isArray(response.data.data)) {
                            messagesData = response.data.data;
                        }
                    }
                    
                    set({ messages: messagesData, isLoading: false });
                    return messagesData;
                } catch (error) {
                    toast.error("Failed to fetch messages");
                    set({ isLoading: false });
                    return [];
                }
            },
            deleteMessage: async (id: number) => {
                try {
                    set({ isLoading: true });
                    await endpoints.messages.delete(id);

                    // Update local state after successful deletion
                    const updatedMessages = get().messages.filter(
                        (message) => message.id !== id
                    );
                    set({ messages: updatedMessages, isLoading: false });

                    toast.success("Message deleted successfully");
                } catch (error) {
                    toast.error("Failed to delete message");
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: "portfolio-messages",
        }
    )
);
