import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { formatTotalsEvidence } from "@/lib/chat/evidence";
import { detectIntent, extractFiscalYear } from "@/lib/chat/intent";
import {
  buildClarificationOptions,
  buildLineItemAnswer,
  buildLineItemCitationSnippet,
  formatPhpAmount,
  parseLineItemQuestion,
  rerankLineItemCandidates,
  shouldAskLineItemClarification,
  toPgVectorLiteral,
  type LineItemMatchCandidate,
  type LineItemRowRecord,
} from "@/lib/chat/line-item-routing";
import { requestPipelineChatAnswer, requestPipelineQueryEmbedding } from "@/lib/chat/pipeline-client";
import {
  detectExplicitBarangayMention,
  normalizeBarangayNameForMatch,
  resolveTotalsScope,
  type BarangayRef,
  type TotalsScopeReason,
} from "@/lib/chat/scope";
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

type RpcLineItemMatchRow = {
  line_item_id: string;
  aip_id: string;
  fiscal_year: number | null;
  barangay_id: string | null;
  aip_ref_code: string | null;
  program_project_title: string;
  page_no: number | null;
  row_no: number | null;
  table_no: number | null;
  similarity: number | null;
};

type DbLineItemRow = {
  id: string;
  aip_id: string;
  fiscal_year: number;
  barangay_id: string | null;
  aip_ref_code: string | null;
  program_project_title: string;
  implementing_agency: string | null;
  start_date: string | null;
  end_date: string | null;
  fund_source: string | null;
  ps: number | null;
  mooe: number | null;
  co: number | null;
  fe: number | null;
  total: number | null;
  expected_output: string | null;
  page_no: number | null;
  row_no: number | null;
  table_no: number | null;
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

type TotalsRoutingLogPayload = {
  request_id: string;
  intent: "total_investment_program";
  route: "sql_totals";
  fiscal_year_parsed: number | null;
  scope_reason: TotalsScopeReason;
  explicit_scope_detected: boolean;
  barangay_id_used: string | null;
  aip_id_selected: string | null;
  totals_found: boolean;
  vector_called: false;
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

function toLineItemMatchCandidates(value: unknown): LineItemMatchCandidate[] {
  if (!Array.isArray(value)) return [];
  const candidates: LineItemMatchCandidate[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const typed = row as Partial<RpcLineItemMatchRow>;
    if (!typed.line_item_id || !typed.aip_id || !typed.program_project_title) continue;
    candidates.push({
      line_item_id: typed.line_item_id,
      aip_id: typed.aip_id,
      fiscal_year: Number.isInteger(typed.fiscal_year)
        ? (typed.fiscal_year as number)
        : (() => {
            const parsed = toNumberOrNull(typed.fiscal_year);
            return Number.isInteger(parsed) ? parsed : null;
          })(),
      barangay_id: typeof typed.barangay_id === "string" ? typed.barangay_id : null,
      aip_ref_code: typeof typed.aip_ref_code === "string" ? typed.aip_ref_code : null,
      program_project_title: typed.program_project_title,
      page_no: Number.isInteger(typed.page_no) ? (typed.page_no as number) : null,
      row_no: Number.isInteger(typed.row_no) ? (typed.row_no as number) : null,
      table_no: Number.isInteger(typed.table_no) ? (typed.table_no as number) : null,
      similarity: toNumberOrNull(typed.similarity),
    });
  }
  return candidates;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toLineItemRows(value: unknown): LineItemRowRecord[] {
  if (!Array.isArray(value)) return [];
  const rows: LineItemRowRecord[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const typed = row as Partial<DbLineItemRow>;
    if (!typed.id || !typed.aip_id || !typed.program_project_title || typeof typed.fiscal_year !== "number") {
      continue;
    }
    rows.push({
      id: typed.id,
      aip_id: typed.aip_id,
      fiscal_year: typed.fiscal_year,
      barangay_id: typeof typed.barangay_id === "string" ? typed.barangay_id : null,
      aip_ref_code: typeof typed.aip_ref_code === "string" ? typed.aip_ref_code : null,
      program_project_title: typed.program_project_title,
      implementing_agency: typeof typed.implementing_agency === "string" ? typed.implementing_agency : null,
      start_date: typeof typed.start_date === "string" ? typed.start_date : null,
      end_date: typeof typed.end_date === "string" ? typed.end_date : null,
      fund_source: typeof typed.fund_source === "string" ? typed.fund_source : null,
      ps: toNumberOrNull(typed.ps),
      mooe: toNumberOrNull(typed.mooe),
      co: toNumberOrNull(typed.co),
      fe: toNumberOrNull(typed.fe),
      total: toNumberOrNull(typed.total),
      expected_output: typeof typed.expected_output === "string" ? typed.expected_output : null,
      page_no: Number.isInteger(typed.page_no) ? (typed.page_no as number) : null,
      row_no: Number.isInteger(typed.row_no) ? (typed.row_no as number) : null,
      table_no: Number.isInteger(typed.table_no) ? (typed.table_no as number) : null,
    });
  }
  return rows;
}

function resolveLineItemBarangayFilter(scopeResolution: ChatScopeResolution): string | null {
  const resolvedTargets = scopeResolution.resolvedTargets ?? [];
  if (scopeResolution.mode === "own_barangay") {
    const barangayTarget = resolvedTargets.find((target) => target.scopeType === "barangay");
    return barangayTarget?.scopeId ?? null;
  }

  if (scopeResolution.mode === "named_scopes") {
    if (resolvedTargets.length !== 1) return null;
    const target = resolvedTargets[0];
    if (target.scopeType !== "barangay") return null;
    return target.scopeId;
  }

  return null;
}

function resolveLineItemScopeName(input: {
  scopeResolution: ChatScopeResolution;
  row: LineItemRowRecord;
}): string {
  const singleResolved =
    input.scopeResolution.resolvedTargets.length === 1
      ? input.scopeResolution.resolvedTargets[0]
      : null;

  if (singleResolved?.scopeType === "barangay") {
    return `${normalizeBarangayLabel(singleResolved.scopeName)} - FY ${input.row.fiscal_year} - ${input.row.program_project_title}`;
  }
  return `FY ${input.row.fiscal_year} - ${input.row.program_project_title}`;
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

function normalizeBarangayLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "your barangay";
  return /^barangay\s+/i.test(trimmed) ? trimmed : `Barangay ${trimmed}`;
}

function isTotalsDebugEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.CHATBOT_DEBUG_LOGS === "true";
}

function logTotalsRouting(payload: TotalsRoutingLogPayload): void {
  if (!isTotalsDebugEnabled()) return;
  console.info(JSON.stringify(payload));
}

function isExplicitScopeDetected(scopeReason: TotalsScopeReason): boolean {
  return scopeReason === "explicit_barangay" || scopeReason === "explicit_our_barangay";
}

function makeTotalsLogPayload(
  payload: Omit<TotalsRoutingLogPayload, "explicit_scope_detected">
): TotalsRoutingLogPayload {
  return {
    ...payload,
    explicit_scope_detected: isExplicitScopeDetected(payload.scope_reason),
  };
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

async function fetchActiveBarangaysForMatching(): Promise<BarangayRef[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("barangays")
    .select("id,name")
    .eq("is_active", true)
    .limit(5000);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const typed = row as ScopeLookupRow;
      return {
        id: typed.id,
        name: (typed.name ?? "").trim(),
      };
    })
    .filter((row) => row.id && row.name);
}

function resolveExplicitBarangayByCandidate(
  candidateName: string,
  barangays: BarangayRef[]
): { status: "none" | "single" | "ambiguous"; barangay?: BarangayRef } {
  const normalizedCandidate = normalizeBarangayNameForMatch(candidateName);
  if (!normalizedCandidate) {
    return { status: "none" };
  }

  const matches = barangays.filter(
    (barangay) => normalizeBarangayNameForMatch(barangay.name) === normalizedCandidate
  );
  if (matches.length === 0) {
    return { status: "none" };
  }
  if (matches.length === 1) {
    return { status: "single", barangay: matches[0] };
  }
  return { status: "ambiguous" };
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
}): Promise<{
  target: TotalsScopeTarget | null;
  explicitBarangay: BarangayRef | null;
  errorMessage?: string;
}> {
  const resolved = input.scopeResolution.resolvedTargets;
  if (resolved.length > 1) {
    return {
      target: null,
      explicitBarangay: null,
      errorMessage:
        "Please ask about one place at a time for total investment queries (one barangay/city/municipality).",
    };
  }

  if (resolved.length === 1) {
    const target = resolved[0];
    const mappedTarget: TotalsScopeTarget = {
      scopeType: target.scopeType,
      scopeId: target.scopeId,
      scopeName: target.scopeName,
    };
    return {
      target: mappedTarget,
      explicitBarangay:
        target.scopeType === "barangay" && target.scopeName
          ? { id: target.scopeId, name: target.scopeName }
          : null,
    };
  }

  const explicitMentionCandidate = detectExplicitBarangayMention(input.message);
  if (explicitMentionCandidate) {
    const barangays = await fetchActiveBarangaysForMatching();
    const match = resolveExplicitBarangayByCandidate(explicitMentionCandidate, barangays);
    if (match.status === "single" && match.barangay) {
      return {
        target: {
          scopeType: "barangay",
          scopeId: match.barangay.id,
          scopeName: match.barangay.name,
        },
        explicitBarangay: match.barangay,
      };
    }
    if (match.status === "ambiguous") {
      return {
        target: null,
        explicitBarangay: null,
        errorMessage:
          "I found multiple barangays with that name. Please specify the exact barangay name.",
      };
    }
  }

  const looseScopeName = parseLooseScopeName(input.message);
  if (looseScopeName) {
    const loose = await findScopeTargetByLooseName(looseScopeName);
    if (loose.status === "single" && loose.target) {
      return {
        target: loose.target,
        explicitBarangay:
          loose.target.scopeType === "barangay" && loose.target.scopeName
            ? { id: loose.target.scopeId, name: loose.target.scopeName }
            : null,
      };
    }
    if (loose.status === "ambiguous") {
      return {
        target: null,
        explicitBarangay: null,
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
      explicitBarangay: null,
    };
  }

  return {
    target: null,
    explicitBarangay: null,
    errorMessage: "I couldn't determine the place scope for this total investment query.",
  };
}

async function resolveUserBarangay(actor: ActorContext): Promise<BarangayRef | null> {
  if (actor.scope.kind !== "barangay" || !actor.scope.id) {
    return null;
  }

  const scopeName = await lookupScopeNameById({
    scopeType: "barangay",
    scopeId: actor.scope.id,
    scopeName: null,
  });
  if (!scopeName) {
    return null;
  }

  return {
    id: actor.scope.id,
    name: scopeName,
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
  requestId: string;
}): Promise<TotalsAssistantPayload> {
  const requestedFiscalYear = extractFiscalYear(input.message);
  const scopeResult = await resolveTotalsScopeTarget({
    actor: input.actor,
    message: input.message,
    scopeResolution: input.scopeResolution,
  });
  const userBarangay = await resolveUserBarangay(input.actor);
  const totalsScope = resolveTotalsScope(input.message, userBarangay, scopeResult.explicitBarangay);

  if (!scopeResult.target) {
    const fallbackMessage =
      scopeResult.errorMessage ??
      "I couldn't determine the requested place. Please specify the exact barangay/city/municipality.";
    logTotalsRouting(
      makeTotalsLogPayload({
      request_id: input.requestId,
      intent: "total_investment_program",
      route: "sql_totals",
      fiscal_year_parsed: requestedFiscalYear,
      scope_reason: totalsScope.scopeReason,
      barangay_id_used: totalsScope.barangayId,
      aip_id_selected: null,
      totals_found: false,
      vector_called: false,
      })
    );
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
  if (target.scopeType === "barangay" && totalsScope.scopeReason === "unknown") {
    const clarificationMessage = "Please specify which barangay you mean for this total investment query.";
    logTotalsRouting(
      makeTotalsLogPayload({
      request_id: input.requestId,
      intent: "total_investment_program",
      route: "sql_totals",
      fiscal_year_parsed: requestedFiscalYear,
      scope_reason: totalsScope.scopeReason,
      barangay_id_used: totalsScope.barangayId,
      aip_id_selected: null,
      totals_found: false,
      vector_called: false,
      })
    );
    return {
      content: clarificationMessage,
      citations: [
        makeSystemCitation("Barangay clarification required for totals SQL lookup.", {
          reason: "scope_clarification_required",
          scope_reason: totalsScope.scopeReason,
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

  const baseScopeLabel = formatScopeLabel(target);
  const answerScopeLabel =
    target.scopeType === "barangay" &&
    totalsScope.scopeReason === "default_user_barangay" &&
    totalsScope.barangayName
      ? `${normalizeBarangayLabel(totalsScope.barangayName)} - based on your account scope`
      : baseScopeLabel;
  const aip = await findPublishedAipForScope({
    target,
    fiscalYear: requestedFiscalYear,
  });

  if (!aip) {
    const noAipMessage =
      requestedFiscalYear !== null
        ? `I couldn't find a published AIP for FY ${requestedFiscalYear} (${answerScopeLabel}).`
        : `I couldn't find a published AIP for ${answerScopeLabel}.`;
    logTotalsRouting(
      makeTotalsLogPayload({
      request_id: input.requestId,
      intent: "total_investment_program",
      route: "sql_totals",
      fiscal_year_parsed: requestedFiscalYear,
      scope_reason: totalsScope.scopeReason,
      barangay_id_used: totalsScope.barangayId,
      aip_id_selected: null,
      totals_found: false,
      vector_called: false,
      })
    );
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
      scopeLabel: answerScopeLabel,
    });
    logTotalsRouting(
      makeTotalsLogPayload({
      request_id: input.requestId,
      intent: "total_investment_program",
      route: "sql_totals",
      fiscal_year_parsed: requestedFiscalYear,
      scope_reason: totalsScope.scopeReason,
      barangay_id_used: totalsScope.barangayId,
      aip_id_selected: aip.id,
      totals_found: false,
      vector_called: false,
      })
    );
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
      scopeLabel: answerScopeLabel,
    });
    logTotalsRouting(
      makeTotalsLogPayload({
      request_id: input.requestId,
      intent: "total_investment_program",
      route: "sql_totals",
      fiscal_year_parsed: requestedFiscalYear,
      scope_reason: totalsScope.scopeReason,
      barangay_id_used: totalsScope.barangayId,
      aip_id_selected: aip.id,
      totals_found: false,
      vector_called: false,
      })
    );
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

  const rawEvidence = totalsRow.evidence_text.trim();
  const formattedEvidence = formatTotalsEvidence(rawEvidence);
  const evidenceText = formattedEvidence || rawEvidence;
  const citationScopeLabel =
    target.scopeType === "barangay" && totalsScope.barangayName
      ? normalizeBarangayLabel(totalsScope.barangayName)
      : baseScopeLabel;
  const citationTitle = `${citationScopeLabel} — FY ${aip.fiscal_year} — Total Investment Program`;
  const pageLabel = totalsRow.page_no !== null ? `page ${totalsRow.page_no}` : "page not specified";
  const answer =
    `The Total Investment Program for FY ${aip.fiscal_year} (${answerScopeLabel}) is ${formatPhp(parsedAmount)}. ` +
    `Evidence: ${pageLabel}, "${evidenceText}".`;
  logTotalsRouting(
    makeTotalsLogPayload({
    request_id: input.requestId,
    intent: "total_investment_program",
    route: "sql_totals",
    fiscal_year_parsed: requestedFiscalYear,
    scope_reason: totalsScope.scopeReason,
    barangay_id_used: totalsScope.barangayId,
    aip_id_selected: aip.id,
    totals_found: true,
    vector_called: false,
    })
  );

  return {
    content: answer,
    citations: [
      {
        sourceId: "T1",
        aipId: aip.id,
        fiscalYear: aip.fiscal_year,
        scopeType: target.scopeType,
        scopeId: target.scopeId,
        scopeName: citationTitle,
        snippet: evidenceText,
        insufficient: false,
        metadata: {
          type: "aip_total",
          page_no: totalsRow.page_no,
          evidence_text: evidenceText,
          evidence_text_raw: rawEvidence,
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
    const requestId = randomUUID();
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
    const intent = detectIntent(content).intent;

    if (!scope.retrievalScope && intent !== "total_investment_program") {
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

    const startedAt = Date.now();
    const intentRoute = await routeSqlFirstTotals<TotalsAssistantPayload, null>({
      intent,
      resolveTotals: async () =>
        resolveTotalsAssistantPayload({
          actor,
          message: content,
          scopeResolution,
          requestId,
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
      if (!intentRoute.value) {
        logTotalsRouting(
          makeTotalsLogPayload({
          request_id: requestId,
          intent: "total_investment_program",
          route: "sql_totals",
          fiscal_year_parsed: extractFiscalYear(content),
          scope_reason: "unknown",
          barangay_id_used: null,
          aip_id_selected: null,
          totals_found: false,
          vector_called: false,
          })
        );
      }

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

    if (!scope.retrievalScope) {
      throw new Error("Retrieval scope missing for non-totals intent.");
    }

    const parsedLineItemQuestion = parseLineItemQuestion(content);
    const requestedFiscalYear = extractFiscalYear(content);

    if (parsedLineItemQuestion.isUnanswerableFieldQuestion) {
      const assistantMessage = await appendAssistantMessage({
        sessionId: session.id,
        content:
          "The published AIP does not contain that field. This is a document limitation, not a retrieval failure.",
        citations: [
          makeSystemCitation("Requested field is outside published AIP structured line-item coverage.", {
            reason: "document_field_limit",
          }),
        ],
        retrievalMeta: {
          refused: true,
          reason: "insufficient_evidence",
          scopeResolution,
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

    if (parsedLineItemQuestion.isFactQuestion) {
      try {
        const embeddedQuery = await requestPipelineQueryEmbedding({ text: content });
        const barangayFilterId = resolveLineItemBarangayFilter(scopeResolution);
        const matchCount = barangayFilterId === null && requestedFiscalYear === null ? 40 : 20;

        const { data: rpcData, error: rpcError } = await client.rpc("match_aip_line_items", {
          p_query_embedding: toPgVectorLiteral(embeddedQuery.embedding),
          p_match_count: matchCount,
          p_fiscal_year: requestedFiscalYear,
          p_barangay_id: barangayFilterId,
        });
        if (rpcError) {
          throw new Error(rpcError.message);
        }

        const ranked = rerankLineItemCandidates({
          question: parsedLineItemQuestion,
          candidates: toLineItemMatchCandidates(rpcData).slice(0, matchCount),
          requestedFiscalYear,
        }).slice(0, 10);

        if (ranked.length === 0) {
          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content:
              "I couldn't find a matching published AIP line item for that question. Try adding a specific project title or reference code.",
            citations: [
              makeSystemCitation("No line-item matches found in row-level index.", {
                reason: "line_item_not_found",
                fiscal_year: requestedFiscalYear,
                barangay_id: barangayFilterId,
              }),
            ],
            retrievalMeta: {
              refused: true,
              reason: "insufficient_evidence",
              scopeResolution,
              latencyMs: Date.now() - startedAt,
              topK: matchCount,
              contextCount: 0,
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

        if (shouldAskLineItemClarification(ranked)) {
          const options = buildClarificationOptions(ranked);
          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content: `I found multiple possible line items. Please clarify which one you mean: ${options
              .map((option, index) => `${index + 1}. ${option}`)
              .join(" ")}`,
            citations: [
              makeSystemCitation("Multiple plausible line-item candidates require clarification.", {
                reason: "line_item_ambiguous",
                options,
              }),
            ],
            retrievalMeta: {
              refused: true,
              reason: "insufficient_evidence",
              scopeResolution,
              latencyMs: Date.now() - startedAt,
              topK: matchCount,
              contextCount: ranked.length,
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

        const candidateIds = ranked
          .slice(0, 3)
          .map((candidate) => candidate.line_item_id)
          .filter((id, index, all) => all.indexOf(id) === index);
        const { data: rowData, error: rowError } = await client
          .from("aip_line_items")
          .select(
            "id,aip_id,fiscal_year,barangay_id,aip_ref_code,program_project_title,implementing_agency,start_date,end_date,fund_source,ps,mooe,co,fe,total,expected_output,page_no,row_no,table_no"
          )
          .in("id", candidateIds);
        if (rowError) {
          throw new Error(rowError.message);
        }

        const rowsById = new Map<string, LineItemRowRecord>(
          toLineItemRows(rowData).map((row) => [row.id, row])
        );
        const selectedRows = candidateIds
          .map((id) => rowsById.get(id))
          .filter((row): row is LineItemRowRecord => Boolean(row));

        if (selectedRows.length === 0) {
          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content:
              "I found relevant line-item references, but I couldn't load the structured row details. Please try again.",
            citations: [makeSystemCitation("Row-level retrieval returned empty result after candidate match.")],
            retrievalMeta: {
              refused: true,
              reason: "insufficient_evidence",
              scopeResolution,
              latencyMs: Date.now() - startedAt,
              topK: matchCount,
              contextCount: ranked.length,
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

        const primaryRow = selectedRows[0];
        const assistantContent = buildLineItemAnswer({
          row: primaryRow,
          fields: parsedLineItemQuestion.factFields,
        });

        const citations: ChatCitation[] = selectedRows.map((row, index) => {
          const rankedCandidate = ranked.find((candidate) => candidate.line_item_id === row.id) ?? null;
          return {
            sourceId: `L${index + 1}`,
            aipId: row.aip_id,
            fiscalYear: row.fiscal_year,
            scopeType: row.barangay_id ? "barangay" : "unknown",
            scopeId: row.barangay_id,
            scopeName: resolveLineItemScopeName({ scopeResolution, row }),
            similarity: rankedCandidate?.similarity ?? null,
            snippet: buildLineItemCitationSnippet(row),
            insufficient: false,
            metadata: {
              type: "aip_line_item",
              line_item_id: row.id,
              aip_ref_code: row.aip_ref_code,
              page_no: row.page_no,
              row_no: row.row_no,
              table_no: row.table_no,
              aip_id: row.aip_id,
              fiscal_year: row.fiscal_year,
              barangay_id: row.barangay_id,
              total: formatPhpAmount(row.total),
            },
          };
        });

        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content: assistantContent,
          citations,
          retrievalMeta: {
            refused: false,
            reason: "ok",
            scopeResolution,
            latencyMs: Date.now() - startedAt,
            topK: matchCount,
            contextCount: ranked.length,
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Structured line-item retrieval request failed.";
        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content:
            "I couldn't complete the structured line-item retrieval due to a temporary system issue. Please try again shortly.",
          citations: [makeSystemCitation("Structured line-item retrieval failed.", { error: message })],
          retrievalMeta: {
            refused: true,
            reason: "pipeline_error",
            scopeResolution,
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
