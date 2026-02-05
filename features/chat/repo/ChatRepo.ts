import type { ChatMessage, ChatSession } from "../types";

export interface ChatRepo {
  listSessions(userId: string): Promise<ChatSession[]>;
  createSession(
    userId: string,
    title?: string | null,
    context?: Record<string, any>
  ): Promise<ChatSession>;
  listMessages(sessionId: string): Promise<ChatMessage[]>;
  addUserMessage(sessionId: string, content: string): Promise<ChatMessage>;
}

export const ChatRepoErrors = {
  FORBIDDEN: "FORBIDDEN",
  INVALID_ROLE: "INVALID_ROLE",
  NOT_FOUND: "NOT_FOUND",
  INVALID_CONTENT: "INVALID_CONTENT",
} as const;
