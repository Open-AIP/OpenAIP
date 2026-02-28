import type { ChatMessageRole } from "@/lib/repos/chat/repo";
import type { ChatCitation, ChatRetrievalMeta } from "@/lib/repos/chat/types";

export type ChatSessionListItem = {
  id: string;
  title: string;
  timeLabel: string;
  isActive: boolean;
};

export type ChatMessageDeliveryStatus = "sent" | "pending" | "failed";

export type ChatMessageBubble = {
  id: string;
  role: ChatMessageRole;
  content: string;
  timeLabel: string;
  deliveryStatus: ChatMessageDeliveryStatus;
  onRetry?: (() => void) | null;
  citations: ChatCitation[];
  retrievalMeta: ChatRetrievalMeta | null;
};
