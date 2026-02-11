type ChatSession = {
  id: string;
  userId: string;
  title?: string | null;
  context: unknown;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  citations?: unknown | null;
  retrievalMeta?: unknown | null;
};

export const CHAT_SESSIONS_FIXTURE: ChatSession[] = [];
export const CHAT_MESSAGES_FIXTURE: ChatMessage[] = [];
