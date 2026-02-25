import { NextResponse } from "next/server";
import { detectIntent, extractFiscalYear } from "@/lib/chat/intent";
import { requestPipelineChatAnswer } from "@/lib/chat/pipeline-client";
import { resolveRetrievalScope } from "@/lib/chat/scope-resolver.server";
import { routeSqlFirstTotals, buildTotalsMissingMessage } from "@/lib/chat/totals-sql-routing";
import type { PipelineChatCitation } from "@/lib/chat/types";
import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getChatRepo } from "@/lib/repos/chat/repo.server";
import type { ChatCitation, ChatMessage, ChatRetrievalMeta, ChatScopeResolution } from "@/lib/repos/chat/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 12000;

type ScopeType = "barangay" | "city" | "municipality";

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "assistant";
  content: string;
  citations: unknown;
  retrieval_meta: unknown;
  created_at: string;
};

type TotalsScopeTarget = {
  scopeType: ScopeType;
  scopeId: string;
  scopeName: string | null;
};

type PublishedAipRow = {
  id: string;
  fiscal_year: number;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
  created_at: string;
};

type AipTotalRow = {
  total_investment_program: number | string;
  page_no: number | null;
  evidence_text: string;
};

type TotalsAssistantPayload = {
  content: string;
  citations: ChatCitation[];
  retrievalMeta: ChatRetrievalMeta;
};

type ScopeLookupRow = {
  id: string;
  name: string | null;
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

function parseLooseScopeName(message: string): string | null {
  const match = message.match(
    /\b(?:in|sa)\s+([a-z0-9][a-z0-9 .,'-]{1,80}?)(?=\s+(?:for|fy|fiscal|year)\b|[.,;!?)]|$)/i
  );
  if (!match) return null;
  const raw = (match[1] ?? "").trim();
  if (!raw) return null;
  const stripped = raw.replace(/^(barangay|city|municipality)\s+/i, "").trim();
  return stripped || null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPhp(value: number): string {
  return `PHP ${new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatScopeLabel(target: TotalsScopeTarget): string {
  const scopedName = target.scopeName?.trim();
  if (!scopedName) {
    if (target.scopeType === "barangay") return "your barangay";
    return `the ${target.scopeType}`;
  }
  if (target.scopeType === "barangay") {
    return /^barangay\s+/i.test(scopedName) ? scopedName : `Barangay ${scopedName}`;
  }
  if (target.scopeType === "city") {
    return /\bcity\b/i.test(scopedName) ? scopedName : `City ${scopedName}`;
  }
  return /\bmunicipality\b/i.test(scopedName) ? scopedName : `Municipality ${scopedName}`;
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

async function queryScopeByName(
  table: "barangays" | "cities" | "municipalities",
  scopeType: ScopeType,
  name: string
): Promise<TotalsScopeTarget[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from(table)
    .select("id,name")
    .eq("is_active", true)
    .ilike("name", name)
    .limit(3);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const typed = row as ScopeLookupRow;
    return {
      scopeType,
      scopeId: typed.id,
      scopeName: typed.name,
    };
  });
}

async function findScopeTargetByLooseName(name: string): Promise<{
  status: "none" | "single" | "ambiguous";
  target?: TotalsScopeTarget;
}> {
  const [barangays, cities, municipalities] = await Promise.all([
    queryScopeByName("barangays", "barangay", name),
    queryScopeByName("cities", "city", name),
    queryScopeByName("municipalities", "municipality", name),
  ]);

  const all = [...barangays, ...cities, ...municipalities];
  if (all.length === 0) {
    return { status: "none" };
  }
  if (all.length === 1) {
    return { status: "single", target: all[0] };
  }
  return { status: "ambiguous" };
}

async function lookupScopeNameById(target: TotalsScopeTarget): Promise<string | null> {
  const admin = supabaseAdmin();
  const table =
    target.scopeType === "barangay"
      ? "barangays"
      : target.scopeType === "city"
        ? "cities"
        : "municipalities";
  const { data, error } = await admin
    .from(table)
    .select("id,name")
    .eq("id", target.scopeId)
    .maybeSingle();
  if (error || !data) return target.scopeName;
  return (data as ScopeLookupRow).name ?? target.scopeName;
}

async function resolveTotalsScopeTarget(input: {
  actor: ActorContext;
  message: string;
  scopeResolution: ChatScopeResolution;
}): Promise<{ target: TotalsScopeTarget | null; errorMessage?: string }> {
  const resolved = input.scopeResolution.resolvedTargets;
  if (resolved.length > 1) {
    return {
      target: null,
      errorMessage:
        "Please ask about one place at a time for total investment queries (one barangay/city/municipality).",
    };
  }

  if (resolved.length === 1) {
    const target = resolved[0];
    return {
      target: {
        scopeType: target.scopeType,
        scopeId: target.scopeId,
        scopeName: target.scopeName,
      },
    };
  }

  const looseScopeName = parseLooseScopeName(input.message);
  if (looseScopeName) {
    const loose = await findScopeTargetByLooseName(looseScopeName);
    if (loose.status === "single" && loose.target) {
      return { target: loose.target };
    }
    if (loose.status === "ambiguous") {
      return {
        target: null,
        errorMessage:
          "I found multiple places with that name. Please specify the exact barangay/city/municipality.",
      };
    }
  }

  if (
    (input.actor.scope.kind === "barangay" ||
      input.actor.scope.kind === "city" ||
      input.actor.scope.kind === "municipality") &&
    input.actor.scope.id
  ) {
    const target: TotalsScopeTarget = {
      scopeType: input.actor.scope.kind,
      scopeId: input.actor.scope.id,
      scopeName: null,
    };
    return {
      target: {
        ...target,
        scopeName: await lookupScopeNameById(target),
      },
    };
  }

  return {
    target: null,
    errorMessage: "I couldn't determine the place scope for this total investment query.",
  };
}

async function findPublishedAipForScope(input: {
  target: TotalsScopeTarget;
  fiscalYear: number | null;
}): Promise<PublishedAipRow | null> {
  const admin = supabaseAdmin();
  let query = admin
    .from("aips")
    .select("id,fiscal_year,barangay_id,city_id,municipality_id,created_at")
    .eq("status", "published");

  if (input.target.scopeType === "barangay") {
    query = query.eq("barangay_id", input.target.scopeId);
  } else if (input.target.scopeType === "city") {
    query = query.eq("city_id", input.target.scopeId);
  } else {
    query = query.eq("municipality_id", input.target.scopeId);
  }

  if (input.fiscalYear !== null) {
    query = query.eq("fiscal_year", input.fiscalYear).order("created_at", { ascending: false });
  } else {
    query = query.order("fiscal_year", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  return (data as PublishedAipRow | null) ?? null;
}

async function findAipTotal(aipId: string): Promise<AipTotalRow | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("aip_totals")
    .select("total_investment_program,page_no,evidence_text")
    .eq("aip_id", aipId)
    .eq("source_label", "total_investment_program")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AipTotalRow | null) ?? null;
}

async function resolveTotalsAssistantPayload(input: {
  actor: ActorContext;
  message: string;
  scopeResolution: ChatScopeResolution;
}): Promise<TotalsAssistantPayload> {
  const requestedFiscalYear = extractFiscalYear(input.message);
  const scopeResult = await resolveTotalsScopeTarget({
    actor: input.actor,
    message: input.message,
    scopeResolution: input.scopeResolution,
  });
  if (!scopeResult.target) {
    const fallbackMessage =
      scopeResult.errorMessage ??
      "I couldn't determine the requested place. Please specify the exact barangay/city/municipality.";
    return {
      content: fallbackMessage,
      citations: [
        makeSystemCitation("Scope clarification required for totals SQL lookup.", {
          reason: "scope_clarification_required",
          scope_resolution: input.scopeResolution,
        }),
      ],
      retrievalMeta: {
        refused: true,
        reason: "ambiguous_scope",
        scopeResolution: input.scopeResolution,
      },
    };
  }

  const target = scopeResult.target;
  const scopeLabel = formatScopeLabel(target);
  const aip = await findPublishedAipForScope({
    target,
    fiscalYear: requestedFiscalYear,
  });

  if (!aip) {
    const noAipMessage =
      requestedFiscalYear !== null
        ? `I couldn't find a published AIP for FY ${requestedFiscalYear} (${scopeLabel}).`
        : `I couldn't find a published AIP for ${scopeLabel}.`;
    return {
      content: noAipMessage,
      citations: [
        makeSystemCitation("No published AIP matched the totals query scope/year.", {
          type: "aip_total_missing",
          scope_type: target.scopeType,
          scope_id: target.scopeId,
          fiscal_year: requestedFiscalYear,
        }),
      ],
      retrievalMeta: {
        refused: true,
        reason: "insufficient_evidence",
        scopeResolution: input.scopeResolution,
      },
    };
  }

  const totalsRow = await findAipTotal(aip.id);
  if (!totalsRow) {
    const missingMessage = buildTotalsMissingMessage({
      fiscalYear: requestedFiscalYear ?? aip.fiscal_year ?? null,
      scopeLabel,
    });
    return {
      content: missingMessage,
      citations: [
        makeSystemCitation("No aip_totals row found for published AIP.", {
          type: "aip_total_missing",
          aip_id: aip.id,
          fiscal_year: aip.fiscal_year,
          scope_type: target.scopeType,
          scope_id: target.scopeId,
        }),
      ],
      retrievalMeta: {
        refused: true,
        reason: "insufficient_evidence",
        scopeResolution: input.scopeResolution,
      },
    };
  }

  const parsedAmount = parseAmount(totalsRow.total_investment_program);
  if (parsedAmount === null) {
    const missingMessage = buildTotalsMissingMessage({
      fiscalYear: requestedFiscalYear ?? aip.fiscal_year ?? null,
      scopeLabel,
    });
    return {
      content: missingMessage,
      citations: [
        makeSystemCitation("Invalid total_investment_program amount format in aip_totals.", {
          type: "aip_total_missing",
          aip_id: aip.id,
          fiscal_year: aip.fiscal_year,
        }),
      ],
      retrievalMeta: {
        refused: true,
        reason: "insufficient_evidence",
        scopeResolution: input.scopeResolution,
      },
    };
  }

  const evidenceText = totalsRow.evidence_text.trim();
  const pageLabel = totalsRow.page_no !== null ? `page ${totalsRow.page_no}` : "page not specified";
  const answer =
    `The Total Investment Program for FY ${aip.fiscal_year} (${scopeLabel}) is ${formatPhp(parsedAmount)}. ` +
    `Evidence: ${pageLabel}, "${evidenceText}".`;

  return {
    content: answer,
    citations: [
      {
        sourceId: "T1",
        aipId: aip.id,
        fiscalYear: aip.fiscal_year,
        scopeType: target.scopeType,
        scopeId: target.scopeId,
        scopeName: scopeLabel,
        snippet: evidenceText,
        insufficient: false,
        metadata: {
          type: "aip_total",
          page_no: totalsRow.page_no,
          evidence_text: evidenceText,
          aip_id: aip.id,
          fiscal_year: aip.fiscal_year,
        },
      },
    ],
    retrievalMeta: {
      refused: false,
      reason: "ok",
      scopeResolution: input.scopeResolution,
    },
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
        citations: [makeSystemCitation("Scope clarification required before retrieval.", scope.scopeResolution)],
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

    const intent = detectIntent(content).intent;
    const startedAt = Date.now();
    const intentRoute = await routeSqlFirstTotals<TotalsAssistantPayload, null>({
      intent,
      resolveTotals: async () =>
        resolveTotalsAssistantPayload({
          actor,
          message: content,
          scopeResolution,
        }),
      resolveNormal: async () => null,
    });

    if (intentRoute.path === "totals") {
      const totalsPayload =
        intentRoute.value ??
        ({
          content: buildTotalsMissingMessage({ fiscalYear: null, scopeLabel: null }),
          citations: [makeSystemCitation("Totals SQL path returned no payload.")],
          retrievalMeta: {
            refused: true,
            reason: "insufficient_evidence",
            scopeResolution,
          },
        } satisfies TotalsAssistantPayload);

      const assistantMessage = await appendAssistantMessage({
        sessionId: session.id,
        content: totalsPayload.content,
        citations: totalsPayload.citations,
        retrievalMeta: {
          ...totalsPayload.retrievalMeta,
          latencyMs: Date.now() - startedAt,
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
      assistantCitations = [makeSystemCitation("No retrieval citations were produced for this response.")];
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
