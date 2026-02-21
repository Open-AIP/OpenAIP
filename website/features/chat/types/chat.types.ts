import type { ChatMessageRole } from "@/lib/repos/chat/repo";

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
