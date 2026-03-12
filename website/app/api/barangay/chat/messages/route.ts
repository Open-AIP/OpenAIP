import { NextResponse } from "next/server";
import { getLguChatAuthFailure } from "@/lib/chat/lgu-route-auth";
import { requestPipelineChatAnswer } from "@/lib/chat/pipeline-client";
import { resolveRetrievalScope } from "@/lib/chat/scope-resolver.server";
import type { PipelineChatCitation, RetrievalFiltersPayload, ScopeResolutionResult } from "@/lib/chat/types";
import type { Json } from "@/lib/contracts/databasev2";
import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getChatRepo } from "@/lib/repos/chat/repo.server";
import type {
  ChatCitation,
  ChatMessage,
  ChatResponseStatus,
  ChatRetrievalMeta,
  ChatScopeResolution,
  RefusalReason,
} from "@/lib/repos/chat/types";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import {
  assertActorPresent,
  assertPrivilegedWriteAccess,
  isInvariantError,
} from "@/lib/security/invariants";
import { getTypedAppSetting, isUserBlocked } from "@/lib/settings/app-settings";
import {
  consumeChatQuota,
  insertAssistantChatMessage,
  type PrivilegedActorContext,
  toPrivilegedActorContext,
} from "@/lib/supabase/privileged-ops";
import { supabaseServer } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 12000;
const RETRIEVAL_FILTER_YEAR_PATTERN = /\b(20\d{2})\b/g;
const RETRIEVAL_FILTER_MULTI_YEAR_CUE_PATTERN =
  /\b(compare|comparison|trend|across|between|vs|versus|from\s+20\d{2}\s+to\s+20\d{2})\b/i;

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "assistant" | "system" | "user";
  content: string;
  citations: unknown;
  retrieval_meta: unknown;
  created_at: string;
};

type RequestBody = {
  sessionId?: string;
  content?: string;
};

type AssistantOutcome = {
  content: string;
  citations: ChatCitation[];
  retrievalMeta: ChatRetrievalMeta;
  status: ChatResponseStatus;
};

type PipelineReason =
  | "ok"
  | "insufficient_evidence"
  | "partial_evidence"
  | "verifier_failed"
  | "ambiguous_scope"
  | "pipeline_error"
  | "validation_failed"
  | "unknown";

function resolveExpectedRouteKind(request: Request): "barangay" | "city" {
  const pathname = new URL(request.url).pathname.toLowerCase();
  return pathname.includes("/api/city/chat/") ? "city" : "barangay";
}

function normalizeUserMessage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, MAX_MESSAGE_LENGTH);
}

function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    citations: (row.citations as ChatCitation[]) ?? null,
    retrievalMeta: (row.retrieval_meta as ChatRetrievalMeta) ?? null,
  };
}

function toScopeResolution(scopeResolution: ScopeResolutionResult): ChatScopeResolution {
  return {
    mode: scopeResolution.mode,
    requestedScopes: scopeResolution.requestedScopes,
    resolvedTargets: scopeResolution.resolvedTargets,
    unresolvedScopes: scopeResolution.unresolvedScopes,
    ambiguousScopes: scopeResolution.ambiguousScopes,
  };
}

function deriveSingleFiscalYearFilter(message: string): number | undefined {
  const parsedYears = Array.from(message.matchAll(RETRIEVAL_FILTER_YEAR_PATTERN))
    .map((match) => Number.parseInt(match[1] ?? "", 10))
    .filter((year) => Number.isInteger(year));
  const uniqueYears = Array.from(new Set(parsedYears));
  if (uniqueYears.length !== 1) {
    return undefined;
  }
  if (RETRIEVAL_FILTER_MULTI_YEAR_CUE_PATTERN.test(message)) {
    return undefined;
  }
  return uniqueYears[0];
}

function detectDocumentTypeFromText(message: string): string | undefined {
  const normalized = message.toLowerCase();
  if (normalized.includes("baip")) return "BAIP";
  if (normalized.includes("aip")) return "AIP";
  return undefined;
}

function buildRetrievalFilters(input: {
  message: string;
  retrievalScope: { targets: Array<{ scope_type: "barangay" | "city" | "municipality"; scope_name: string }> };
}): RetrievalFiltersPayload {
  const filters: RetrievalFiltersPayload = {
    publication_status: "published",
  };

  const fiscalYear = deriveSingleFiscalYearFilter(input.message);
  if (typeof fiscalYear === "number") {
    filters.fiscal_year = fiscalYear;
  }

  const documentType = detectDocumentTypeFromText(input.message);
  if (documentType) {
    filters.document_type = documentType;
  }

  if (input.retrievalScope.targets.length === 1) {
    const target = input.retrievalScope.targets[0];
    filters.scope_type = target.scope_type;
    filters.scope_name = target.scope_name;
  }

  return filters;
}

function makeSystemCitation(snippet: string, metadata?: Record<string, unknown>): ChatCitation {
  return {
    sourceId: "S0",
    scopeType: "system",
    scopeName: "System",
    snippet,
    insufficient: true,
    metadata: metadata ?? null,
  };
}

function normalizePipelineCitations(citations: PipelineChatCitation[]): ChatCitation[] {
  return citations
    .map((citation, index) => {
      const sourceId = (citation.source_id ?? "").trim() || `C${index + 1}`;
      const snippet = (citation.snippet ?? "").trim();
      if (!snippet) {
        return null;
      }

      const metadata =
        citation.metadata && typeof citation.metadata === "object" && !Array.isArray(citation.metadata)
          ? (citation.metadata as Record<string, unknown>)
          : null;

      const distance =
        metadata && typeof metadata.distance === "number" && Number.isFinite(metadata.distance)
          ? metadata.distance
          : null;
      const matchScore =
        metadata && typeof metadata.match_score === "number" && Number.isFinite(metadata.match_score)
          ? metadata.match_score
          : null;

      const scopeType =
        citation.scope_type === "barangay" ||
        citation.scope_type === "city" ||
        citation.scope_type === "municipality" ||
        citation.scope_type === "unknown" ||
        citation.scope_type === "system"
          ? citation.scope_type
          : "unknown";

      return {
        sourceId,
        chunkId: citation.chunk_id ?? null,
        aipId: citation.aip_id ?? null,
        fiscalYear: citation.fiscal_year ?? null,
        scopeType,
        scopeId: citation.scope_id ?? null,
        scopeName: citation.scope_name ?? null,
        similarity: citation.similarity ?? null,
        distance,
        matchScore,
        snippet,
        insufficient: citation.insufficient ?? false,
        metadata: metadata ?? null,
      } satisfies ChatCitation;
    })
    .filter((value): value is ChatCitation => value !== null);
}

function mapReasonToRefusalReason(reason: PipelineReason): RefusalReason {
  if (reason === "ambiguous_scope") return "ambiguous_scope";
  if (reason === "validation_failed") return "missing_required_parameter";
  if (reason === "partial_evidence") return "document_limitation";
  return "retrieval_failure";
}

function buildRefusalMessage(reason: PipelineReason): string {
  if (reason === "ambiguous_scope") {
    return "I couldn't resolve the requested scope confidently, so I can't run retrieval. Please provide the exact barangay, city, or municipality name.";
  }
  if (reason === "validation_failed") {
    return "I can't provide a grounded answer from retrieval for that request. Please include clearer scope or fiscal-year details and try again.";
  }
  if (reason === "pipeline_error") {
    return "I couldn't complete retrieval due to a temporary system issue. Please try again in a few moments.";
  }
  return "I couldn't find enough relevant retrieved evidence to answer reliably.";
}

function buildScopeRefusalOutcome(input: {
  scopeResolution: ChatScopeResolution;
  clarificationMessage?: string;
  latencyMs: number;
}): AssistantOutcome {
  const detail =
    input.clarificationMessage ??
    "Scope resolution failed before retrieval because the requested place could not be matched confidently.";

  return {
    content: buildRefusalMessage("ambiguous_scope"),
    citations: [makeSystemCitation("Scope resolution failed before retrieval.", { scope_resolution: input.scopeResolution })],
    retrievalMeta: {
      refused: true,
      reason: "ambiguous_scope",
      status: "refusal",
      refusalReason: "ambiguous_scope",
      refusalDetail: detail,
      scopeResolution: input.scopeResolution,
      latencyMs: input.latencyMs,
      verifierMode: "retrieval",
      routeFamily: "pipeline_fallback",
      responseModeSource: "pipeline_refusal",
    },
    status: "refusal",
  };
}

function buildPipelineErrorOutcome(input: {
  scopeResolution: ChatScopeResolution;
  latencyMs: number;
  errorMessage: string;
}): AssistantOutcome {
  return {
    content: buildRefusalMessage("pipeline_error"),
    citations: [
      makeSystemCitation("Pipeline chat request failed.", {
        reason: "pipeline_error",
        error: input.errorMessage,
      }),
    ],
    retrievalMeta: {
      refused: true,
      reason: "pipeline_error",
      status: "refusal",
      refusalReason: "retrieval_failure",
      refusalDetail: input.errorMessage,
      scopeResolution: input.scopeResolution,
      latencyMs: input.latencyMs,
      verifierMode: "retrieval",
      routeFamily: "pipeline_fallback",
      responseModeSource: "pipeline_refusal",
    },
    status: "refusal",
  };
}

function buildPipelineOutcome(input: {
  pipeline: Awaited<ReturnType<typeof requestPipelineChatAnswer>>;
  scopeResolution: ChatScopeResolution;
  latencyMs: number;
}): AssistantOutcome {
  const citations = normalizePipelineCitations(input.pipeline.citations);
  let reason = (input.pipeline.retrieval_meta?.reason ?? "unknown") as PipelineReason;
  let refused = Boolean(input.pipeline.refused);
  let content = input.pipeline.answer.trim();

  if (!content) {
    refused = true;
    reason = "validation_failed";
    content = buildRefusalMessage(reason);
  }

  if (citations.length === 0) {
    refused = true;
    if (reason === "ok") {
      reason = "validation_failed";
    }
    citations.push(
      makeSystemCitation("No retrieval citations were produced for this response.", {
        reason: "missing_citations",
      })
    );
    content = buildRefusalMessage(reason);
  }

  const status: ChatResponseStatus = refused ? "refusal" : "answer";
  const refusalReason = refused ? mapReasonToRefusalReason(reason) : undefined;

  return {
    content,
    citations,
    retrievalMeta: {
      refused,
      reason,
      status,
      ...(refused ? { refusalReason } : {}),
      scopeResolution: input.scopeResolution,
      latencyMs: input.latencyMs,
      topK: input.pipeline.retrieval_meta?.top_k,
      minSimilarity: input.pipeline.retrieval_meta?.min_similarity,
      contextCount: input.pipeline.retrieval_meta?.context_count,
      verifierPassed: input.pipeline.retrieval_meta?.verifier_passed,
      verifierMode: input.pipeline.retrieval_meta?.verifier_mode ?? "retrieval",
      verifierPolicyPassed: input.pipeline.retrieval_meta?.verifier_policy_passed,
      evidenceGateDecision: input.pipeline.retrieval_meta?.evidence_gate_decision,
      evidenceGateReason: input.pipeline.retrieval_meta?.evidence_gate_reason,
      evidenceGateReasonCode: input.pipeline.retrieval_meta?.evidence_gate_reason_code,
      generationSkippedByGate: input.pipeline.retrieval_meta?.generation_skipped_by_gate,
      selectiveMultiQueryTriggered: input.pipeline.retrieval_meta?.multi_query_triggered,
      selectiveMultiQueryVariantCount: input.pipeline.retrieval_meta?.multi_query_variant_count,
      multiQueryReasonCode:
        input.pipeline.retrieval_meta?.multi_query_reason_code ??
        input.pipeline.retrieval_meta?.multi_query_reason,
      activeRagFlags: input.pipeline.retrieval_meta?.active_rag_flags,
      ragCalibration: input.pipeline.retrieval_meta?.rag_calibration,
      stageLatencyMs: input.pipeline.retrieval_meta?.stage_latency_ms,
      borderlineDetected: input.pipeline.retrieval_meta?.borderline_detected,
      borderlineReasonCode: input.pipeline.retrieval_meta?.borderline_reason_code,
      routeFamily: "pipeline_fallback",
      responseModeSource: refused
        ? "pipeline_refusal"
        : reason === "partial_evidence"
          ? "pipeline_partial"
          : "pipeline_generated",
    },
    status,
  };
}

async function consumeQuota(
  actor: PrivilegedActorContext | null,
  userId: string,
  route: "barangay_chat_message" | "city_chat_message"
): Promise<{ allowed: boolean; reason: string }> {
  const rateLimit = await getTypedAppSetting("controls.chatbot_rate_limit");
  const payload = await consumeChatQuota({
    actor,
    userId,
    maxRequests: rateLimit.maxRequests,
    timeWindow: rateLimit.timeWindow,
    route,
  });
  return {
    allowed: payload.allowed,
    reason: payload.reason,
  };
}

async function appendAssistantMessage(input: {
  actor: PrivilegedActorContext;
  sessionId: string;
  outcome: AssistantOutcome;
}): Promise<ChatMessage> {
  const inserted = (await insertAssistantChatMessage({
    actor: input.actor,
    sessionId: input.sessionId,
    content: input.outcome.content,
    citations: input.outcome.citations as unknown as Json,
    retrievalMeta: input.outcome.retrievalMeta as unknown as Json,
  })) as ChatMessageRow;

  return toChatMessage(inserted);
}

function chatResponsePayload(input: {
  sessionId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  status: ChatResponseStatus;
}) {
  return {
    sessionId: input.sessionId,
    userMessage: input.userMessage,
    assistantMessage: input.assistantMessage,
    status: input.status,
  };
}

async function resolveSession(input: {
  repo: ReturnType<typeof getChatRepo>;
  actor: ActorContext;
  sessionId: string | undefined;
}): Promise<string | null> {
  if (!input.sessionId) {
    return null;
  }

  const existing = await input.repo.getSession(input.sessionId);
  if (!existing || existing.userId !== input.actor.userId) {
    return null;
  }
  return existing.id;
}

export async function POST(request: Request) {
  try {
    const csrf = enforceCsrfProtection(request);
    if (!csrf.ok) {
      return csrf.response;
    }

    const actor = await getActorContext();
    const expectedRoute = resolveExpectedRouteKind(request);
    const authFailure = getLguChatAuthFailure(expectedRoute, actor, "messages");
    if (authFailure) {
      return NextResponse.json({ message: authFailure.message }, { status: authFailure.status });
    }

    assertActorPresent(actor, "Authentication required.");
    assertPrivilegedWriteAccess({
      actor,
      allowlistedRoles: ["barangay_official", "city_official"],
      scopeByRole: {
        barangay_official: "barangay",
        city_official: "city",
      },
      requireScopeId: true,
      message: "Forbidden. Missing required LGU scope.",
    });

    if (await isUserBlocked(actor.userId)) {
      return NextResponse.json(
        { message: "Your account is currently blocked from chatbot usage." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const content = normalizeUserMessage(body.content);
    if (!content) {
      return NextResponse.json({ message: "Message cannot be empty." }, { status: 400 });
    }

    const repo = getChatRepo();
    const privilegedActor = toPrivilegedActorContext(actor);
    if (!privilegedActor) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const existingSessionId = await resolveSession({
      repo,
      actor,
      sessionId: body.sessionId,
    });
    if (body.sessionId && !existingSessionId) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    const quota = await consumeQuota(
      privilegedActor,
      actor.userId,
      expectedRoute === "city" ? "city_chat_message" : "barangay_chat_message"
    );
    if (!quota.allowed) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again shortly.", reason: quota.reason },
        { status: 429 }
      );
    }

    let sessionId = existingSessionId;
    if (!sessionId) {
      const created = await repo.createSession(actor.userId);
      sessionId = created.id;
    }

    const session = await repo.getSession(sessionId);
    if (!session || session.userId !== actor.userId) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    const userMessage = await repo.appendUserMessage(session.id, content);
    const startedAt = Date.now();

    const client = await supabaseServer();
    const scope = await resolveRetrievalScope({
      client,
      actor,
      question: content,
    });
    const scopeResolution = toScopeResolution(scope.scopeResolution);

    let outcome: AssistantOutcome;
    if (!scope.retrievalScope || scope.mode === "ambiguous") {
      outcome = buildScopeRefusalOutcome({
        scopeResolution,
        clarificationMessage: scope.clarificationMessage,
        latencyMs: Date.now() - startedAt,
      });
    } else {
      try {
        const pipeline = await requestPipelineChatAnswer({
          question: content,
          retrievalScope: scope.retrievalScope,
          retrievalMode: "qa",
          retrievalFilters: buildRetrievalFilters({
            message: content,
            retrievalScope: scope.retrievalScope,
          }),
          topK: 5,
          minSimilarity: 0.3,
        });

        outcome = buildPipelineOutcome({
          pipeline,
          scopeResolution,
          latencyMs: Date.now() - startedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pipeline chat request failed.";
        outcome = buildPipelineErrorOutcome({
          scopeResolution,
          latencyMs: Date.now() - startedAt,
          errorMessage: message,
        });
      }
    }

    const assistantMessage = await appendAssistantMessage({
      actor: privilegedActor,
      sessionId: session.id,
      outcome,
    });

    return NextResponse.json(
      chatResponsePayload({
        sessionId: session.id,
        userMessage,
        assistantMessage,
        status: outcome.status,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (isInvariantError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unexpected chatbot error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
