import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatStore {
  apiKey: string;
  provider: 'gpt' | 'gemini';
  setApiKey: (key: string) => void;
  setProvider: (provider: 'gpt' | 'gemini') => void;
  chatHistory: { id: string; messages: Message[] }[];
  addChat: (messages: Message[]) => void;
  deleteChat: (id: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      apiKey: '',
      provider: 'gpt',
      setApiKey: (key) => set({ apiKey: key }),
      setProvider: (provider) => set({ provider }),
      chatHistory: [],
      addChat: (messages) => 
        set((state) => ({
          chatHistory: [
            { id: Date.now().toString(), messages },
            ...state.chatHistory,
          ].slice(0, 20), // Keep only last 20 chats
        })),
      deleteChat: (id) =>
        set((state) => ({
          chatHistory: state.chatHistory.filter((chat) => chat.id !== id),
        })),
    }),
    {
      name: 'chat-storage',
    }
  )
);