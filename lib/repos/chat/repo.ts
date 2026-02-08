import type { ChatMessageRole } from "@/lib/contracts/databasev2";

export type { ChatMessageRole };

export const ChatRepoErrors = {
  FORBIDDEN: "FORBIDDEN",
  INVALID_ROLE: "INVALID_ROLE",
  NOT_FOUND: "NOT_FOUND",
  INVALID_CONTENT: "INVALID_CONTENT",
} as const;

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

// [DATAFLOW] UI should depend on this interface; adapters handle storage (mock now; Supabase later).
// [DBV2] Tables: `public.chat_sessions` + `public.chat_messages`.
// [SECURITY] DBV2 is append-only for messages; client inserts are restricted to `role='user'` (assistant/system messages must be server-side).
// [SUPABASE-SWAP] Implement a Supabase adapter using those tables and RLS (`can_access_chat_session`).
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
