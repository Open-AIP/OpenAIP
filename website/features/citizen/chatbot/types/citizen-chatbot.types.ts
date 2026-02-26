import type { ChatMessageRole, Json } from "@/lib/contracts/databasev2";

export type CitizenChatScopeChip = {
  id: string;
  label: string;
};

export type CitizenChatFollowUp = {
  id: string;
  label: string;
};

export type CitizenChatEvidenceItem = {
  id: string;
  documentLabel: string;
  snippet: string;
  fiscalYear: string | null;
  pageOrSection: string | null;
};

export type CitizenChatSessionVM = {
  id: string;
  title: string;
  snippet: string;
  timeLabel: string;
  scopeBadge: string;
  isActive: boolean;
};

export type CitizenChatMessageVM = {
  id: string;
  role: ChatMessageRole;
  content: string;
  timeLabel: string;
  citations: Json | null;
  retrievalMeta: Json | null;
  evidence: CitizenChatEvidenceItem[];
  followUps: CitizenChatFollowUp[];
};

export type CitizenChatReplyResult = {
  message: {
    id: string;
    sessionId: string;
    role: "assistant";
    content: string;
    createdAt: string;
    citations: Json | null;
    retrievalMeta: Json | null;
  };
  suggestedFollowUps: string[];
};

export type CitizenChatErrorState = "none" | "no_published_aip" | "retrieval_failed" | "auth_required";
