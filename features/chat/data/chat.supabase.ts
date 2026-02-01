import type { ChatMessage, ChatRepo, ChatSession } from "./ChatRepo";

export function createSupabaseChatRepo(): ChatRepo {
  return {
    async listSessions(_userId: string): Promise<ChatSession[]> {
      throw new Error("Not implemented");
    },

    async getSession(_sessionId: string): Promise<ChatSession | null> {
      throw new Error("Not implemented");
    },

    async createSession(
      _userId: string,
      _payload?: { title?: string; context?: unknown }
    ): Promise<ChatSession> {
      throw new Error("Not implemented");
    },

    async renameSession(
      _sessionId: string,
      _title: string
    ): Promise<ChatSession | null> {
      throw new Error("Not implemented");
    },

    async listMessages(_sessionId: string): Promise<ChatMessage[]> {
      throw new Error("Not implemented");
    },

    async appendUserMessage(
      _sessionId: string,
      _content: string
    ): Promise<ChatMessage> {
      throw new Error("Not implemented");
    },
  };
}
