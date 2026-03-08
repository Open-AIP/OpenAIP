import { NextResponse } from "next/server";

import { getChatStrategyConfigSnapshot } from "@/lib/chat/chat-strategy-config";
import { maybeRewriteFollowUpQuery } from "@/lib/chat/contextual-query-rewrite";
import { getLguChatAuthFailure } from "@/lib/chat/lgu-route-auth";
import { requestPipelineChatAnswer, requestPipelineIntentClassify } from "@/lib/chat/pipeline-client";
import { buildRefusalMessage } from "@/lib/chat/refusal";
import { decideRoute } from "@/lib/chat/router-decision";
import { resolveRetrievalScope } from "@/lib/chat/scope-resolver.server";
import {
  inferRouteFamily,
  inferSemanticRetrievalAttempted,
  mapResponseModeReasonCode,
  mapRewriteReasonCode,
  mapVerifierReasonCode,
} from "@/lib/chat/telemetry-reason-codes";
import type { Json } from "@/lib/contracts/databasev2";
import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getChatRepo } from "@/lib/repos/chat/repo.server";
import type {
  ChatCitation,
  ChatClarificationPayload,
  ChatMessage,
  ChatResponseStatus,
  ChatRetrievalMeta,
  RefusalReason,
} from "@/lib/repos/chat/types";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import { assertPrivilegedWriteAccess, isInvariantError } from "@/lib/security/invariants";
import { getTypedAppSetting, isUserBlocked } from "@/lib/settings/app-settings";
import {
  consumeChatQuota,
  insertAssistantChatMessage,
  toPrivilegedActorContext,
} from "@/lib/supabase/privileged-ops";
import { supabaseServer } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 12000;

type RequestBody = {
  sessionId?: string;
  content?: string;
};

function resolveExpectedRouteKind(request: Request): "barangay" | "city" {
  const pathname = new URL(request.url).pathname.toLowerCase();
  return pathname.includes("/api/city/chat/") ? "city" : "barangay";
}

function toJson(value: unknown): Json {
  return value as Json;
}

function conversationalReply(intent: string): string {
  switch (intent) {
    case "GREETING":
      return "Hi! I can help with published AIP questions using available document evidence.";
    case "THANKS":
      return "You're welcome. Ask another AIP question whenever you're ready.";
    case "COMPLAINT":
      return "Thanks for reporting that. Please share the exact claim and scope so I can re-check the sources.";
    case "CLARIFY":
      return "Sure. Please include the scope and fiscal year so I can answer with citations.";
    case "OUT_OF_SCOPE":
      return "I can only answer questions grounded in published AIP data.";
    default:
      return "How can I help with your AIP question?";
  }
}

function toChatCitation(citation: {
  source_id: string;
  chunk_id?: string | null;
  aip_id?: string | null;
  fiscal_year?: number | null;
  scope_type?: "barangay" | "city" | "municipality" | "unknown" | "system";
  scope_id?: string | null;
  scope_name?: string | null;
  similarity?: number | null;
  snippet: string;
  insufficient?: boolean;
  metadata?: unknown | null;
}): ChatCitation {
  return {
    sourceId: citation.source_id,
    chunkId: citation.chunk_id ?? null,
    aipId: citation.aip_id ?? null,
    fiscalYear: citation.fiscal_year ?? null,
    scopeType: citation.scope_type ?? "unknown",
    scopeId: citation.scope_id ?? null,
    scopeName: citation.scope_name ?? null,
    similarity: citation.similarity ?? null,
    snippet: citation.snippet,
    insufficient: citation.insufficient ?? false,
    metadata: citation.metadata ?? null,
  };
}

function isRefusalReason(value: unknown): value is RefusalReason {
  return (
    value === "retrieval_failure" ||
    value === "document_limitation" ||
    value === "ambiguous_scope" ||
    value === "missing_required_parameter" ||
    value === "unsupported_request"
  );
}

function deriveStatus(input: {
  pipelineRefused: boolean;
  retrievalMeta: Record<string, unknown>;
}): ChatResponseStatus {
  const rawStatus = input.retrievalMeta.status;
  if (rawStatus === "answer" || rawStatus === "clarification" || rawStatus === "refusal") {
    return rawStatus;
  }

  if (input.retrievalMeta.kind === "clarification") {
    return "clarification";
  }

  if (input.pipelineRefused) {
    return "refusal";
  }

  if (input.retrievalMeta.reason === "ambiguous_scope") {
    return "clarification";
  }

  return "answer";
}

function inferRefusalReason(input: {
  status: ChatResponseStatus;
  retrievalMeta: Record<string, unknown>;
}): RefusalReason | undefined {
  if (input.status !== "refusal") return undefined;

  const explicit = input.retrievalMeta.refusalReason;
  if (isRefusalReason(explicit)) return explicit;

  const reason = input.retrievalMeta.reason;
  if (reason === "ambiguous_scope") return "ambiguous_scope";
  if (reason === "unsupported_request") return "unsupported_request";
  return "retrieval_failure";
}

function toAssistantMessage(row: {
  id: string;
  session_id: string;
  role: "assistant";
  content: string;
  citations: unknown;
  retrieval_meta: unknown;
  created_at: string;
}): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    citations: (row.citations as ChatCitation[] | null) ?? null,
    retrievalMeta: (row.retrieval_meta as ChatRetrievalMeta | null) ?? null,
    createdAt: row.created_at,
  };
}

function logInfo(payload: Record<string, unknown>) {
  try {
    console.info(JSON.stringify(payload));
  } catch {
    console.info("[chat][log_error]");
  }
}

async function sendAssistantMessage(input: {
  actor: NonNullable<ReturnType<typeof toPrivilegedActorContext>>;
  sessionId: string;
  userMessage: ChatMessage;
  content: string;
  citations: ChatCitation[];
  retrievalMeta: ChatRetrievalMeta;
  status: ChatResponseStatus;
  clarification?: ChatClarificationPayload;
}) {
  const inserted = await insertAssistantChatMessage({
    actor: input.actor,
    sessionId: input.sessionId,
    content: input.content,
    citations: toJson(input.citations),
    retrievalMeta: toJson(input.retrievalMeta),
  });

  return NextResponse.json({
    sessionId: input.sessionId,
    userMessage: input.userMessage,
    assistantMessage: toAssistantMessage(inserted),
    status: input.status,
    ...(input.clarification ? { clarification: input.clarification } : {}),
  });
}

function verifierModeFromMeta(meta: Record<string, unknown>): "structured" | "retrieval" | "mixed" {
  const value = meta.verifier_mode;
  if (value === "structured" || value === "retrieval" || value === "mixed") {
    return value;
  }
  return "retrieval";
}

function responseModeSourceFromMeta(meta: Record<string, unknown>) {
  const value = meta.response_mode_source;
  if (value === "pipeline_generated" || value === "pipeline_partial" || value === "pipeline_refusal") {
    return value;
  }
  return "pipeline_generated" as const;
}

function buildAccessScopeByRole(expectedRoute: "barangay" | "city") {
  return expectedRoute === "city"
    ? ({ city_official: "city" } as const)
    : ({ barangay_official: "barangay" } as const);
}

export async function POST(request: Request) {
  try {
    const csrf = enforceCsrfProtection(request);
    if (!csrf.ok) {
      return csrf.response;
    }

    const expectedRoute = resolveExpectedRouteKind(request);
    const actor = await getActorContext();
    const authFailure = getLguChatAuthFailure(expectedRoute, actor, "messages");
    if (authFailure) {
      return NextResponse.json({ message: authFailure.message }, { status: authFailure.status });
    }

    const body = (await request.json().catch(() => null)) as RequestBody | null;
    const content = body?.content?.trim() ?? "";
    const providedSessionId = body?.sessionId?.trim() || null;

    if (!content) {
      return NextResponse.json({ message: "Message content is required." }, { status: 400 });
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { message: `Message exceeds ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (!actor) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    assertPrivilegedWriteAccess({
      actor,
      allowlistedRoles: ["barangay_official", "city_official"],
      scopeByRole: buildAccessScopeByRole(expectedRoute),
      requireScopeId: true,
      message: "Forbidden. Missing required LGU scope.",
    });

    if (await isUserBlocked(actor.userId)) {
      return NextResponse.json(
        { message: "Your account is currently blocked from chatbot usage." },
        { status: 403 }
      );
    }

    const privilegedActor = toPrivilegedActorContext(actor);
    if (!privilegedActor) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const quotaSetting = await getTypedAppSetting("controls.chatbot_rate_limit");
    const quota = await consumeChatQuota({
      actor: privilegedActor,
      userId: actor.userId,
      maxRequests: quotaSetting.maxRequests,
      timeWindow: quotaSetting.timeWindow,
      route: expectedRoute === "city" ? "city_chat_messages" : "barangay_chat_messages",
    });

    if (!quota.allowed) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again shortly.", reason: quota.reason },
        { status: 429 }
      );
    }

    const chatRepo = getChatRepo();
    const session = providedSessionId
      ? await chatRepo.getSession(providedSessionId)
      : await chatRepo.createSession(actor.userId);

    if (!session) {
      return NextResponse.json({ message: "Chat session not found." }, { status: 404 });
    }

    if (session.userId !== actor.userId) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const userMessage = await chatRepo.appendUserMessage(session.id, content);
    const messages = await chatRepo.listMessages(session.id);

    const strategySnapshot = getChatStrategyConfigSnapshot();

    let routeDecision: ReturnType<typeof decideRoute> | null = null;
    let intentClassification: Awaited<ReturnType<typeof requestPipelineIntentClassify>> | null = null;

    try {
      intentClassification = await requestPipelineIntentClassify({ text: content });
      routeDecision = decideRoute({
        text: content,
        intentClassification,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "intent classification failed";
      logInfo({
        event: "intent_classification_failed",
        request_id: userMessage.id,
        executionPath: "rag_only",
        message,
      });
    }

    if (routeDecision?.kind === "CONVERSATIONAL") {
      const retrievalMeta: ChatRetrievalMeta = {
        refused: false,
        reason: "conversational_shortcut",
        status: "answer",
        intentClassification: intentClassification ?? undefined,
        routeFamily: "conversational",
        semanticRetrievalAttempted: false,
        queryRewriteApplied: false,
        queryRewriteReason: "conversational_shortcut",
        rewriteReasonCode: "no_rewrite_non_domain",
        responseModeReasonCode: "full_answer",
        verifierMode: "retrieval",
        verifierPolicyPassed: true,
        verifierPolicyReasonCode: "narrative_grounded",
        responseModeSource: "pipeline_generated",
        activeChatFlags: strategySnapshot.flags,
        chatStrategyCalibration: strategySnapshot.calibration,
        executionPath: "rag_only",
      };

      logInfo({
        event: "chat_execution",
        request_id: userMessage.id,
        executionPath: "rag_only",
        routeFamily: retrievalMeta.routeFamily,
        status: retrievalMeta.status,
      });

      return sendAssistantMessage({
        actor: privilegedActor,
        sessionId: session.id,
        userMessage,
        content: conversationalReply(intentClassification?.intent ?? "UNKNOWN"),
        citations: [],
        retrievalMeta,
        status: "answer",
      });
    }

    let rewrittenQuery = content;
    let rewriteReason: string | undefined;
    let rewriteApplied = false;

    if (strategySnapshot.flags.CHAT_CONTEXTUAL_REWRITE_ENABLED) {
      const rewrite = maybeRewriteFollowUpQuery({
        message: content,
        messages,
        currentMessageId: userMessage.id,
      });

      if (rewrite.kind === "clarify") {
        const refusal = buildRefusalMessage({
          intent: "pipeline_fallback",
          queryText: content,
          scopeResolved: true,
        });

        const retrievalMeta: ChatRetrievalMeta = {
          refused: false,
          reason: "clarification_needed",
          status: "clarification",
          refusalReason: refusal.reason,
          refusalDetail: refusal.message,
          suggestions: refusal.suggestions,
          routeFamily: "pipeline_fallback",
          semanticRetrievalAttempted: false,
          queryRewriteApplied: false,
          queryRewriteReason: rewrite.reason,
          rewriteReasonCode: mapRewriteReasonCode(rewrite.reason),
          responseModeReasonCode: "clarification_required",
          verifierMode: "retrieval",
          verifierPolicyPassed: true,
          verifierPolicyReasonCode: "narrative_grounded",
          responseModeSource: "pipeline_generated",
          activeChatFlags: strategySnapshot.flags,
          chatStrategyCalibration: strategySnapshot.calibration,
          executionPath: "rag_only",
        };

        return sendAssistantMessage({
          actor: privilegedActor,
          sessionId: session.id,
          userMessage,
          content: rewrite.prompt,
          citations: [],
          retrievalMeta,
          status: "clarification",
        });
      }

      rewriteApplied = rewrite.kind === "rewritten";
      rewrittenQuery = rewrite.query;
      rewriteReason = rewrite.reason;

      logInfo({
        event: "contextual_query_rewrite",
        request_id: userMessage.id,
        executionPath: "rag_only",
        rewrite_triggered: rewriteApplied,
        rewrite_reason: rewrite.reason,
        original_query_preview: content.slice(0, 180),
        rewritten_query_preview: rewrittenQuery.slice(0, 180),
      });
    }

    const scope = await resolveRetrievalScope({
      client: await supabaseServer(),
      actor: actor as ActorContext,
      question: rewrittenQuery,
    });

    if (!scope.retrievalScope) {
      const clarification =
        scope.clarificationMessage ||
        "I couldn't confidently resolve the requested scope. Please provide the exact barangay/city/municipality name.";
      const retrievalMeta: ChatRetrievalMeta = {
        refused: false,
        reason: "clarification_needed",
        status: "clarification",
        refusalReason: "ambiguous_scope",
        refusalDetail: clarification,
        scopeResolution: scope.scopeResolution,
        routeFamily: "pipeline_fallback",
        semanticRetrievalAttempted: false,
        queryRewriteApplied: rewriteApplied,
        queryRewriteReason: rewriteReason,
        rewriteReasonCode: mapRewriteReasonCode(rewriteReason),
        responseModeReasonCode: "clarification_required",
        verifierMode: "retrieval",
        verifierPolicyPassed: true,
        verifierPolicyReasonCode: "narrative_grounded",
        responseModeSource: "pipeline_generated",
        activeChatFlags: strategySnapshot.flags,
        chatStrategyCalibration: strategySnapshot.calibration,
        executionPath: "rag_only",
      };

      logInfo({
        event: "chat_execution",
        request_id: userMessage.id,
        executionPath: "rag_only",
        routeFamily: retrievalMeta.routeFamily,
        status: retrievalMeta.status,
        reason: retrievalMeta.reason,
      });

      return sendAssistantMessage({
        actor: privilegedActor,
        sessionId: session.id,
        userMessage,
        content: clarification,
        citations: [],
        retrievalMeta,
        status: "clarification",
      });
    }

    let pipelineAnswer: Awaited<ReturnType<typeof requestPipelineChatAnswer>>;
    try {
      pipelineAnswer = await requestPipelineChatAnswer({
        question: rewrittenQuery,
        retrievalScope: scope.retrievalScope,
      });
    } catch {
      const refusal = buildRefusalMessage({
        intent: "pipeline_fallback",
        queryText: rewrittenQuery,
        explicitScopeRequested: scope.mode === "named_scopes",
        scopeResolved: true,
      });

      const retrievalMeta: ChatRetrievalMeta = {
        refused: true,
        reason: "pipeline_error",
        status: "refusal",
        refusalReason: refusal.reason,
        refusalDetail: refusal.message,
        suggestions: refusal.suggestions,
        scopeResolution: scope.scopeResolution,
        routeFamily: "pipeline_fallback",
        semanticRetrievalAttempted: true,
        queryRewriteApplied: rewriteApplied,
        queryRewriteReason: rewriteReason,
        rewriteReasonCode: mapRewriteReasonCode(rewriteReason),
        responseModeReasonCode: "refusal_returned",
        verifierMode: "retrieval",
        verifierPolicyPassed: false,
        verifierPolicyReasonCode: "narrative_ungrounded",
        responseModeSource: "pipeline_refusal",
        activeChatFlags: strategySnapshot.flags,
        chatStrategyCalibration: strategySnapshot.calibration,
        executionPath: "rag_only",
      };

      logInfo({
        event: "chat_execution",
        request_id: userMessage.id,
        executionPath: "rag_only",
        routeFamily: retrievalMeta.routeFamily,
        status: retrievalMeta.status,
        reason: retrievalMeta.reason,
      });

      return sendAssistantMessage({
        actor: privilegedActor,
        sessionId: session.id,
        userMessage,
        content: refusal.message,
        citations: [],
        retrievalMeta,
        status: "refusal",
      });
    }

    const citations = pipelineAnswer.citations.map(toChatCitation);
    const rawMeta =
      pipelineAnswer.retrieval_meta && typeof pipelineAnswer.retrieval_meta === "object"
        ? (pipelineAnswer.retrieval_meta as Record<string, unknown>)
        : {};

    const derivedStatus = deriveStatus({
      pipelineRefused: pipelineAnswer.refused,
      retrievalMeta: rawMeta,
    });

    const refusalReason = inferRefusalReason({
      status: derivedStatus,
      retrievalMeta: rawMeta,
    });

    const retrievalMeta: ChatRetrievalMeta = {
      refused: pipelineAnswer.refused || derivedStatus === "refusal",
      reason:
        typeof rawMeta.reason === "string"
          ? (rawMeta.reason as ChatRetrievalMeta["reason"])
          : pipelineAnswer.refused
            ? "insufficient_evidence"
            : "ok",
      topK: typeof rawMeta.top_k === "number" ? rawMeta.top_k : undefined,
      minSimilarity:
        typeof rawMeta.min_similarity === "number" ? rawMeta.min_similarity : undefined,
      contextCount: typeof rawMeta.context_count === "number" ? rawMeta.context_count : undefined,
      verifierPassed: typeof rawMeta.verifier_passed === "boolean" ? rawMeta.verifier_passed : undefined,
      status: derivedStatus,
      refusalReason,
      scopeResolution: scope.scopeResolution,
      verifierMode: verifierModeFromMeta(rawMeta),
      denseCandidateCount:
        typeof rawMeta.dense_candidate_count === "number" ? rawMeta.dense_candidate_count : undefined,
      keywordCandidateCount:
        typeof rawMeta.keyword_candidate_count === "number" ? rawMeta.keyword_candidate_count : undefined,
      fusedCandidateCount:
        typeof rawMeta.fused_candidate_count === "number" ? rawMeta.fused_candidate_count : undefined,
      denseFinalCount:
        typeof rawMeta.dense_final_count === "number" ? rawMeta.dense_final_count : undefined,
      keywordFinalCount:
        typeof rawMeta.keyword_final_count === "number" ? rawMeta.keyword_final_count : undefined,
      denseContributedToFinal:
        typeof rawMeta.dense_contributed_to_final === "boolean"
          ? rawMeta.dense_contributed_to_final
          : undefined,
      keywordContributedToFinal:
        typeof rawMeta.keyword_contributed_to_final === "boolean"
          ? rawMeta.keyword_contributed_to_final
          : undefined,
      evidenceGateDecision:
        rawMeta.evidence_gate_decision === "allow" ||
        rawMeta.evidence_gate_decision === "clarify" ||
        rawMeta.evidence_gate_decision === "refuse"
          ? rawMeta.evidence_gate_decision
          : undefined,
      evidenceGateReason:
        typeof rawMeta.evidence_gate_reason === "string" ? rawMeta.evidence_gate_reason : undefined,
      evidenceGateReasonCode:
        typeof rawMeta.evidence_gate_reason_code === "string"
          ? rawMeta.evidence_gate_reason_code
          : undefined,
      generationSkippedByGate:
        typeof rawMeta.generation_skipped_by_gate === "boolean"
          ? rawMeta.generation_skipped_by_gate
          : undefined,
      selectiveMultiQueryTriggered:
        typeof rawMeta.multi_query_triggered === "boolean" ? rawMeta.multi_query_triggered : undefined,
      selectiveMultiQueryVariantCount:
        typeof rawMeta.multi_query_variant_count === "number"
          ? rawMeta.multi_query_variant_count
          : undefined,
      multiQueryReasonCode:
        typeof rawMeta.multi_query_reason_code === "string" ? rawMeta.multi_query_reason_code : undefined,
      activeRagFlags:
        rawMeta.active_rag_flags && typeof rawMeta.active_rag_flags === "object"
          ? (rawMeta.active_rag_flags as Record<string, boolean>)
          : undefined,
      ragCalibration:
        rawMeta.rag_calibration && typeof rawMeta.rag_calibration === "object"
          ? (rawMeta.rag_calibration as Record<string, number | boolean>)
          : undefined,
      stageLatencyMs:
        rawMeta.stage_latency_ms && typeof rawMeta.stage_latency_ms === "object"
          ? (rawMeta.stage_latency_ms as Record<string, number>)
          : undefined,
      borderlineDetected:
        typeof rawMeta.borderline_detected === "boolean" ? rawMeta.borderline_detected : undefined,
      borderlineReasonCode:
        typeof rawMeta.borderline_reason_code === "string" ? rawMeta.borderline_reason_code : undefined,
      responseModeSource: responseModeSourceFromMeta(rawMeta),
      queryRewriteApplied: rewriteApplied,
      queryRewriteReason: rewriteReason,
      rewriteReasonCode: mapRewriteReasonCode(rewriteReason),
      intentClassification: intentClassification ?? undefined,
      activeChatFlags: strategySnapshot.flags,
      chatStrategyCalibration: strategySnapshot.calibration,
      routeFamily: "pipeline_fallback",
      executionPath: "rag_only",
    };

    const verifierPassed = citations.length > 0;
    retrievalMeta.verifierPolicyPassed = verifierPassed;
    retrievalMeta.verifierMode = "retrieval";
    retrievalMeta.verifierPolicyReasonCode = verifierPassed
      ? "narrative_grounded"
      : "narrative_ungrounded";

    retrievalMeta.routeFamily = inferRouteFamily(retrievalMeta, citations);
    retrievalMeta.responseModeReasonCode = mapResponseModeReasonCode(retrievalMeta);
    retrievalMeta.verifierPolicyReasonCode =
      mapVerifierReasonCode(retrievalMeta) ?? retrievalMeta.verifierPolicyReasonCode;
    retrievalMeta.semanticRetrievalAttempted = inferSemanticRetrievalAttempted(retrievalMeta, citations);

    let assistantContent = pipelineAnswer.answer;
    let responseStatus = derivedStatus;

    if (responseStatus === "answer" && !verifierPassed) {
      const refusal = buildRefusalMessage({
        intent: "pipeline_fallback",
        queryText: rewrittenQuery,
        explicitScopeRequested: scope.mode === "named_scopes",
        scopeResolved: true,
      });

      assistantContent = refusal.message;
      responseStatus = "refusal";
      retrievalMeta.refused = true;
      retrievalMeta.reason = "verifier_failed";
      retrievalMeta.status = "refusal";
      retrievalMeta.refusalReason = refusal.reason;
      retrievalMeta.refusalDetail = refusal.message;
      retrievalMeta.suggestions = refusal.suggestions;
      retrievalMeta.responseModeReasonCode = "refusal_returned";
      retrievalMeta.responseModeSource = "pipeline_refusal";
      retrievalMeta.verifierPolicyPassed = false;
      retrievalMeta.verifierPolicyReasonCode = "narrative_ungrounded";
    }

    if (responseStatus === "refusal" && !retrievalMeta.refusalReason) {
      retrievalMeta.refusalReason = "retrieval_failure";
    }

    if (responseStatus === "refusal" && !assistantContent.trim()) {
      const fallbackRefusal = buildRefusalMessage({
        intent: "pipeline_fallback",
        queryText: rewrittenQuery,
        explicitScopeRequested: scope.mode === "named_scopes",
        scopeResolved: true,
      });
      assistantContent = fallbackRefusal.message;
      retrievalMeta.refusalDetail = fallbackRefusal.message;
      retrievalMeta.suggestions = fallbackRefusal.suggestions;
      retrievalMeta.refusalReason = fallbackRefusal.reason;
    }

    logInfo({
      event: "chat_execution",
      request_id: userMessage.id,
      executionPath: "rag_only",
      routeFamily: retrievalMeta.routeFamily,
      status: responseStatus,
      reason: retrievalMeta.reason,
    });

    return sendAssistantMessage({
      actor: privilegedActor,
      sessionId: session.id,
      userMessage,
      content: assistantContent,
      citations,
      retrievalMeta,
      status: responseStatus,
      clarification:
        responseStatus === "clarification" && retrievalMeta.clarification
          ? (retrievalMeta.clarification as ChatClarificationPayload)
          : undefined,
    });
  } catch (error) {
    if (isInvariantError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
