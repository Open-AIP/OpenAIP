export type {
  ChatMessageRole,
  ChatSessionRecord,
  ChatMessageRecord,
  ChatSession,
  ChatMessage,
} from "@/lib/types/domain/chat.domain";

export const ChatRepoErrors = {
  FORBIDDEN: "FORBIDDEN",
  INVALID_ROLE: "INVALID_ROLE",
  NOT_FOUND: "NOT_FOUND",
  INVALID_CONTENT: "INVALID_CONTENT",
} as const;



