export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatSession = {
  id: string;
  userId: string;
  title?: string | null;
  context: unknown;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  citations?: unknown | null;
  retrievalMeta?: unknown | null;
};

export interface ChatRepo {
  listSessions(userId: string): Promise<ChatSession[]>;
  getSession(sessionId: string): Promise<ChatSession | null>;
  createSession(
    userId: string,
    payload?: { title?: string; context?: unknown }
  ): Promise<ChatSession>;
  renameSession(sessionId: string, title: string): Promise<ChatSession | null>;
  listMessages(sessionId: string): Promise<ChatMessage[]>;
  appendUserMessage(sessionId: string, content: string): Promise<ChatMessage>;
}
