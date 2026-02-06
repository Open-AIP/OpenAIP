export type {
  ChatMessage,
  ChatMessageRole,
  ChatRepo,
  ChatSession,
} from "../data/ChatRepo";

export const ChatRepoErrors = {
  FORBIDDEN: "FORBIDDEN",
  INVALID_ROLE: "INVALID_ROLE",
  NOT_FOUND: "NOT_FOUND",
  INVALID_CONTENT: "INVALID_CONTENT",
} as const;
