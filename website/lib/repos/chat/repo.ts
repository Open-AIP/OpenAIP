import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockChatRepo } from "./repo.mock";

export type {
  ChatCitation,
  ChatMessage,
  ChatMessageRole,
  ChatRetrievalMeta,
  ChatScopeResolution,
  ChatSession,
} from "./types";
export { ChatRepoErrors } from "./types";

import type { ChatMessage, ChatSession } from "./types";

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

export function getChatRepo(): ChatRepo {
  return selectRepo({
    label: "ChatRepo",
    mock: () => createMockChatRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "ChatRepo is server-only outside mock mode. Import from `@/lib/repos/chat/repo.server`."
      );
    },
  });
}
