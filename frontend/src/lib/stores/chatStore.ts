import { create } from "zustand";
import type { ChatSource, UiChatMessage } from "@/types/chat";

type ChatState = {
  activeSessionId: string | null;
  messages: UiChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  error: string | null;

  setActiveSession: (id: string | null) => void;
  setMessages: (messages: UiChatMessage[]) => void;
  addUserMessage: (content: string) => void;
  startStreaming: () => void;
  appendToken: (token: string) => void;
  finalizeMessage: (messageId: string, sources: ChatSource[]) => void;
  setError: (message: string | null) => void;
  reset: () => void;
};

const initialState = {
  activeSessionId: null as string | null,
  messages: [] as UiChatMessage[],
  isStreaming: false,
  streamingText: "",
  error: null as string | null,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  setActiveSession: (id) => set({ activeSessionId: id }),

  setMessages: (messages) => set({ messages, streamingText: "", isStreaming: false, error: null }),

  addUserMessage: (content) => {
    const sessionId = get().activeSessionId;

    if (!sessionId) {
      return;
    }

    const userMessage: UiChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversationId: sessionId,
      role: "user",
      content,
      sources: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      error: null,
    }));
  },

  startStreaming: () => set({ isStreaming: true, streamingText: "", error: null }),

  appendToken: (token) =>
    set((state) => ({
      streamingText: state.streamingText + token,
    })),

  finalizeMessage: (messageId, sources) => {
    const sessionId = get().activeSessionId;
    const streamingText = get().streamingText;

    if (!sessionId) {
      return;
    }

    const assistantMessage: UiChatMessage = {
      id: messageId,
      conversationId: sessionId,
      role: "assistant",
      content: streamingText,
      sources,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...get().messages, assistantMessage],
      isStreaming: false,
      streamingText: "",
    });
  },

  setError: (message) =>
    set({
      error: message,
      isStreaming: false,
      streamingText: "",
    }),

  reset: () => set(initialState),
}));
