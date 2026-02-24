import { NextResponse } from "next/server";
import { requestPipelineChatAnswer } from "@/lib/chat/pipeline-client";
import { resolveRetrievalScope } from "@/lib/chat/scope-resolver.server";
import type { PipelineChatCitation } from "@/lib/chat/types";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getChatRepo } from "@/lib/repos/chat/repo.server";
import type { ChatCitation, ChatMessage, ChatRetrievalMeta, ChatScopeResolution } from "@/lib/repos/chat/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 12000;

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "assistant";
  content: string;
  citations: unknown;
  retrieval_meta: unknown;
  created_at: string;
};

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

function normalizeUserMessage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, MAX_MESSAGE_LENGTH);
}

function toScopeResolution(input: {
  mode: ChatScopeResolution["mode"];
  requestedScopes: ChatScopeResolution["requestedScopes"];
  resolvedTargets: ChatScopeResolution["resolvedTargets"];
  unresolvedScopes: string[];
  ambiguousScopes: Array<{ scopeName: string; candidateCount: number }>;
}): ChatScopeResolution {
  return {
    mode: input.mode,
    requestedScopes: input.requestedScopes,
    resolvedTargets: input.resolvedTargets,
    unresolvedScopes: input.unresolvedScopes,
    ambiguousScopes: input.ambiguousScopes,
  };
}

function makeSystemCitation(snippet: string, metadata?: unknown): ChatCitation {
  return {
    sourceId: "S0",
    snippet,
    scopeType: "system",
    scopeName: "System",
    insufficient: true,
    metadata: metadata ?? null,
  };
}

function normalizePipelineCitations(citations: PipelineChatCitation[]): ChatCitation[] {
  const normalized: ChatCitation[] = [];
  for (const citation of citations) {
    const snippet = typeof citation.snippet === "string" ? citation.snippet.trim() : "";
    if (!snippet) continue;

    normalized.push({
      sourceId: citation.source_id || "S0",
      chunkId: citation.chunk_id ?? null,
      aipId: citation.aip_id ?? null,
      fiscalYear: citation.fiscal_year ?? null,
      scopeType: citation.scope_type ?? "unknown",
      scopeId: citation.scope_id ?? null,
      scopeName: citation.scope_name ?? null,
      similarity: citation.similarity ?? null,
      snippet,
      insufficient: Boolean(citation.insufficient),
      metadata: citation.metadata ?? null,
    });
  }
  return normalized;
}

async function appendAssistantMessage(params: {
  sessionId: string;
  content: string;
  citations: ChatCitation[];
  retrievalMeta: ChatRetrievalMeta;
}): Promise<ChatMessage> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("chat_messages")
    .insert({
      session_id: params.sessionId,
      role: "assistant",
      content: params.content,
      citations: params.citations,
      retrieval_meta: params.retrievalMeta,
    })
    .select("id,session_id,role,content,citations,retrieval_meta,created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to append assistant response.");
  }

  return toChatMessage(data as ChatMessageRow);
}

async function consumeQuota(userId: string): Promise<{ allowed: boolean; reason: string }> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("consume_chat_quota", {
    p_user_id: userId,
    p_per_minute: 8,
    p_per_day: 200,
    p_route: "barangay_chat_message",
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as { allowed?: unknown; reason?: unknown };
  return {
    allowed: payload.allowed === true,
    reason: typeof payload.reason === "string" ? payload.reason : "unknown",
  };
}

export async function POST(request: Request) {
  try {
    const actor = await getActorContext();
    if (!actor || actor.role !== "barangay_official") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
      content?: string;
    };
    const content = normalizeUserMessage(body.content);
    if (!content) {
      return NextResponse.json({ message: "Message cannot be empty." }, { status: 400 });
    }

    const repo = getChatRepo();
    let sessionId = body.sessionId ?? null;

    if (sessionId) {
      const existing = await repo.getSession(sessionId);
      if (!existing || existing.userId !== actor.userId) {
        return NextResponse.json({ message: "Session not found." }, { status: 404 });
      }
    }

    const quota = await consumeQuota(actor.userId);
    if (!quota.allowed) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again shortly.", reason: quota.reason },
        { status: 429 }
      );
    }

    if (!sessionId) {
      const created = await repo.createSession(actor.userId);
      sessionId = created.id;
    }

    const session = await repo.getSession(sessionId);
    if (!session || session.userId !== actor.userId) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    const userMessage = await repo.appendUserMessage(session.id, content);

    const client = await supabaseServer();
    const scope = await resolveRetrievalScope({
      client,
      actor,
      question: content,
    });

    const scopeResolution = toScopeResolution({
      mode: scope.scopeResolution.mode,
      requestedScopes: scope.scopeResolution.requestedScopes,
      resolvedTargets: scope.scopeResolution.resolvedTargets,
      unresolvedScopes: scope.scopeResolution.unresolvedScopes,
      ambiguousScopes: scope.scopeResolution.ambiguousScopes,
    });

    if (!scope.retrievalScope) {
      const assistantContent =
        scope.clarificationMessage ??
        "I couldn't confidently identify the requested place. Please provide the exact barangay/city/municipality name.";
      const assistantMessage = await appendAssistantMessage({
        sessionId: session.id,
        content: assistantContent,
        citations: [
          makeSystemCitation(
            "Scope clarification required before retrieval.",
            scope.scopeResolution
          ),
        ],
        retrievalMeta: {
          refused: true,
          reason: "ambiguous_scope",
          scopeResolution,
        },
      });

      return NextResponse.json(
        {
          sessionId: session.id,
          userMessage,
          assistantMessage,
        },
        { status: 200 }
      );
    }

    const startedAt = Date.now();

    let assistantContent = "";
    let assistantCitations: ChatCitation[] = [];
    let assistantMeta: ChatRetrievalMeta = {
      refused: true,
      reason: "unknown",
      scopeResolution,
    };

    try {
      const pipeline = await requestPipelineChatAnswer({
        question: content,
        retrievalScope: scope.retrievalScope,
        topK: 8,
        minSimilarity: 0.3,
      });

      assistantContent = pipeline.answer.trim();
      assistantCitations = normalizePipelineCitations(pipeline.citations);
      assistantMeta = {
        refused: Boolean(pipeline.refused),
        reason: pipeline.retrieval_meta?.reason ?? "unknown",
        topK: pipeline.retrieval_meta?.top_k,
        minSimilarity: pipeline.retrieval_meta?.min_similarity,
        contextCount: pipeline.retrieval_meta?.context_count,
        verifierPassed: pipeline.retrieval_meta?.verifier_passed,
        latencyMs: Date.now() - startedAt,
        scopeResolution,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline chat request failed.";
      assistantContent =
        "I couldn't complete the response due to a temporary system issue. Please try again in a few moments.";
      assistantCitations = [makeSystemCitation("Pipeline request failed.", { error: message })];
      assistantMeta = {
        refused: true,
        reason: "pipeline_error",
        scopeResolution,
        latencyMs: Date.now() - startedAt,
      };
    }

    if (!assistantContent) {
      assistantContent = "I can't provide a grounded answer right now.";
    }

    if (assistantCitations.length === 0) {
      assistantCitations = [
        makeSystemCitation("No retrieval citations were produced for this response."),
      ];
      assistantMeta = {
        ...assistantMeta,
        refused: true,
        reason: assistantMeta.reason === "ok" ? "validation_failed" : assistantMeta.reason,
      };
    }

    const assistantMessage = await appendAssistantMessage({
      sessionId: session.id,
      content: assistantContent,
      citations: assistantCitations,
      retrievalMeta: assistantMeta,
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        userMessage,
        assistantMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected chatbot error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
