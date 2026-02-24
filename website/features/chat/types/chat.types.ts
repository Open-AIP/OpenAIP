import type { ChatMessageRole } from "@/lib/repos/chat/repo";
import type { ChatCitation, ChatRetrievalMeta } from "@/lib/repos/chat/types";

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
  citations: ChatCitation[];
  retrievalMeta: ChatRetrievalMeta | null;
};
