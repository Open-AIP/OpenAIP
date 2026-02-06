import type { ChatMessage, ChatRepo, ChatSession } from "./ChatRepo";

// [SUPABASE-SWAP] Future Supabase adapter for `ChatRepo`.
// [DBV2] Tables:
//   - `public.chat_sessions` (owned by `user_id`)
//   - `public.chat_messages` (append-only; client inserts restricted to `role='user'`)
// [SECURITY] RLS uses `can_access_chat_session(session_id)`; assistant/system message inserts must be server-side (service role).
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
