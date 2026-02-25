import type { ChatMessageRole } from "@/lib/contracts/databasev2";

export type { ChatMessageRole };

export type ChatCitationScopeType =
  | "barangay"
  | "city"
  | "municipality"
  | "unknown"
  | "system";

export type ChatResponseStatus = "answer" | "clarification" | "refusal";

export type ChatClarificationOption = {
  optionIndex: number;
  lineItemId: string;
  title: string;
  refCode: string | null;
  fiscalYear: number | null;
  barangayName: string | null;
  total: string | null;
};

export type ChatClarificationPayload = {
  id: string;
  kind: "line_item_disambiguation";
  prompt: string;
  options: ChatClarificationOption[];
};

export type ChatCitation = {
  sourceId: string;
  chunkId?: string | null;
  aipId?: string | null;
  fiscalYear?: number | null;
  scopeType?: ChatCitationScopeType;
  scopeId?: string | null;
  scopeName?: string | null;
  similarity?: number | null;
  distance?: number | null;
  matchScore?: number | null;
  snippet: string;
  insufficient?: boolean;
  metadata?: unknown | null;
};

export type ChatScopeResolutionMode =
  | "global"
  | "own_barangay"
  | "named_scopes"
  | "ambiguous"
  | "unresolved";

export type ChatScopeResolution = {
  mode: ChatScopeResolutionMode;
  requestedScopes: Array<{
    scopeType: "barangay" | "city" | "municipality";
    scopeName: string;
  }>;
  resolvedTargets: Array<{
    scopeType: "barangay" | "city" | "municipality";
    scopeId: string;
    scopeName: string;
  }>;
  unresolvedScopes?: string[];
  ambiguousScopes?: Array<{ scopeName: string; candidateCount: number }>;
};

export type ChatRetrievalMeta = {
  refused: boolean;
  reason:
    | "ok"
    | "insufficient_evidence"
    | "clarification_needed"
    | "verifier_failed"
    | "ambiguous_scope"
    | "pipeline_error"
    | "validation_failed"
    | "unknown";
  topK?: number;
  minSimilarity?: number;
  contextCount?: number;
  verifierPassed?: boolean;
  scopeResolution?: ChatScopeResolution;
  latencyMs?: number;
  status?: ChatResponseStatus;
  kind?: "clarification" | "clarification_resolved";
  clarification?: ChatClarificationPayload & {
    context?: {
      factFields: string[];
      scopeReason: string;
      barangayName: string | null;
    };
  };
  clarificationResolution?: {
    clarificationId: string;
    selectedLineItemId: string;
  };
};

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
  citations?: ChatCitation[] | null;
  retrievalMeta?: ChatRetrievalMeta | null;
};

