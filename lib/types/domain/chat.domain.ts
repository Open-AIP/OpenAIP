import type {
  ChatMessageRole,
  ChatMessageRow,
  ChatSessionRow,
} from "@/lib/contracts/databasev2";

export type { ChatMessageRole } from "@/lib/contracts/databasev2";

export type ChatSessionRecord = ChatSessionRow;
export type ChatMessageRecord = ChatMessageRow;

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
