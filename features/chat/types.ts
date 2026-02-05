export type ChatSession = {
  id: string;
  userId: string;
  title?: string | null;
  context: Record<string, any>;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  citations?: any | null;
  retrievalMeta?: any | null;
  createdAt: string;
};
