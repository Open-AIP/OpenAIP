import type { ChatMessageRow, ChatSessionRow } from "@/lib/contracts/databasev2";
import type { ChatMessageRole } from "@/lib/repos/chat/types";

export type ChatSessionRecord = ChatSessionRow;
export type ChatMessageRecord = ChatMessageRow;

export type ChatSessionListItem = {
  id: string;
  title: string;
  snippet: string;
  timeLabel: string;
  isActive: boolean;
};

export type ChatMessageBubble = {
  id: string;
  role: ChatMessageRole;
  content: string;
  timeLabel: string;
};
