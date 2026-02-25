import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { formatTotalsEvidence } from "@/lib/chat/evidence";
import { detectAggregationIntent } from "@/lib/chat/aggregation-intent";
import { detectIntent, extractFiscalYear } from "@/lib/chat/intent";
import {
  buildClarificationOptions,
  buildLineItemAnswer,
  buildLineItemCitationScopeName,
  buildLineItemCitationSnippet,
  buildLineItemScopeDisclosure,
  extractAipRefCode,
  formatPhpAmount,
  parseLineItemQuestion,
  rerankLineItemCandidates,
  resolveLineItemScopeDecision,
  shouldAskLineItemClarification,
  isLineItemSpecificQuery,
  toPgVectorLiteral,
  type LineItemMatchCandidate,
  type LineItemRowRecord,
  type LineItemFactField,
  type LineItemScopeReason,
} from "@/lib/chat/line-item-routing";
import { requestPipelineChatAnswer, requestPipelineQueryEmbedding } from "@/lib/chat/pipeline-client";
import {
  detectBareBarangayScopeMention,
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
import type {
  ChatCitation,
  ChatClarificationOption,
  ChatClarificationPayload,
  ChatMessage,
  ChatResponseStatus,
  ChatRetrievalMeta,
  ChatScopeResolution,
} from "@/lib/repos/chat/types";
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
  distance?: number | null;
  score?: number | null;
  similarity?: number | null;
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

type RpcTopProjectRow = {
  line_item_id: string;
  aip_id: string;
  fiscal_year: number | null;
  barangay_id: string | null;
  aip_ref_code: string | null;
  program_project_title: string;
  fund_source: string | null;
  start_date: string | null;
  end_date: string | null;
  total: number | string | null;
  page_no: number | null;
  row_no: number | null;
  table_no: number | null;
};

type RpcTotalsBySectorRow = {
  sector_code: string | null;
  sector_name: string | null;
  sector_total: number | string | null;
  count_items: number | string | null;
};

type RpcTotalsByFundSourceRow = {
  fund_source: string | null;
  fund_total: number | string | null;
  count_items: number | string | null;
};

type RpcCompareFiscalYearTotalsRow = {
  year_a_total: number | string | null;
  year_b_total: number | string | null;
  delta: number | string | null;
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

type NonTotalsRoutingLogPayload = {
  request_id: string;
  intent:
    | "line_item_fact"
    | "unanswerable_field"
    | "clarification_needed"
    | "pipeline_fallback"
    | "aggregate_top_projects"
    | "aggregate_totals_by_sector"
    | "aggregate_totals_by_fund_source"
    | "aggregate_compare_years";
  route: "row_sql" | "pipeline_fallback" | "aggregate_sql";
  fiscal_year_parsed: number | null;
  scope_reason: LineItemScopeReason;
  barangay_id_used: string | null;
  match_count_used: number | null;
  limit_used?: number | null;
  top_candidate_ids: string[];
  top_candidate_distances: number[];
  answered: boolean;
  // vector_called means the row-match RPC was called (not the query-embedding call).
  vector_called: boolean;
};

type ClarificationLifecycleLogPayload =
  | {
      request_id: string;
      event: "clarification_created";
      session_id: string;
      clarification_id: string;
      option_count: number;
      top_candidate_ids: string[];
    }
  | {
      request_id: string;
      event: "clarification_resolved";
      session_id: string;
      clarification_id: string;
      selected_line_item_id: string;
    };

type ClarificationSelection =
  | { kind: "numeric"; optionIndex: number }
  | { kind: "ref"; refCode: string }
  | { kind: "title"; titleQuery: string };

type PendingClarificationRecord = {
  messageId: string;
  payload: ChatClarificationPayload & {
    context?: {
      factFields: string[];
      scopeReason: string;
      barangayName: string | null;
    };
  };
};

type AssistantMetaRow = {
  id: string;
  retrieval_meta: unknown | null;
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

function makeAggregateCitation(snippet: string, metadata?: unknown): ChatCitation {
  return {
    sourceId: "S0",
    snippet,
    scopeType: "system",
    scopeName: "Aggregated published AIP line items",
    insufficient: false,
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
      distance:
        toNumberOrNull(typed.distance) ??
        (() => {
          const similarity = toNumberOrNull(typed.similarity);
          if (similarity === null) return null;
          return Math.max(0, 1 - similarity);
        })(),
      score:
        toNumberOrNull(typed.score) ??
        (() => {
          const distance = toNumberOrNull(typed.distance);
          if (distance !== null) return 1 / (1 + distance);
          return toNumberOrNull(typed.similarity);
        })(),
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

function normalizeSelectionText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRefCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
  return normalized || null;
}

function parseClarificationSelection(message: string): ClarificationSelection | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return {
      kind: "numeric",
      optionIndex: Number.parseInt(trimmed, 10),
    };
  }

  const refMatch = trimmed.match(/ref\s*([a-z0-9-]+)/i);
  if (refMatch?.[1]) {
    return {
      kind: "ref",
      refCode: refMatch[1],
    };
  }

  return {
    kind: "title",
    titleQuery: trimmed,
  };
}

function isShortClarificationInput(message: string): boolean {
  return message.trim().length > 0 && message.trim().length <= 30;
}

function isClarificationCancelMessage(message: string): boolean {
  const normalized = normalizeSelectionText(message);
  if (!normalized) return false;

  return (
    normalized === "none of the above" ||
    normalized === "cancel" ||
    normalized.startsWith("cancel ") ||
    normalized === "stop" ||
    normalized === "nevermind" ||
    normalized === "never mind"
  );
}

function resolveClarificationOptionFromSelection(input: {
  selection: ClarificationSelection;
  options: ChatClarificationOption[];
}): ChatClarificationOption | null {
  if (input.selection.kind === "numeric") {
    const option = input.options.find((item) => item.optionIndex === input.selection.optionIndex);
    return option ?? null;
  }

  if (input.selection.kind === "ref") {
    const normalizedSelectionRef = normalizeRefCode(input.selection.refCode);
    if (!normalizedSelectionRef) return null;
    const matches = input.options.filter((item) => normalizeRefCode(item.refCode) === normalizedSelectionRef);
    return matches.length === 1 ? matches[0] : null;
  }

  const normalizedQuery = normalizeSelectionText(input.selection.titleQuery);
  if (normalizedQuery.length < 3) return null;
  const titleMatches = input.options.filter((item) =>
    normalizeSelectionText(item.title).includes(normalizedQuery)
  );
  return titleMatches.length === 1 ? titleMatches[0] : null;
}

function parseFactFields(input: string[] | undefined): LineItemFactField[] {
  const fields = new Set<LineItemFactField>();
  for (const raw of input ?? []) {
    if (
      raw === "amount" ||
      raw === "schedule" ||
      raw === "fund_source" ||
      raw === "implementing_agency" ||
      raw === "expected_output"
    ) {
      fields.add(raw);
    }
  }
  return Array.from(fields);
}

function buildClarificationPromptContent(payload: ChatClarificationPayload): string {
  return `${payload.prompt}\n${payload.options
    .map(
      (option) =>
        `${option.optionIndex}. ${option.title}` +
        (option.refCode ? ` (Ref ${option.refCode})` : "") +
        (option.total ? ` - Total: ${option.total}` : "") +
        (option.fiscalYear ? ` - FY ${option.fiscalYear}` : "") +
        (option.barangayName ? ` - ${option.barangayName}` : "")
    )
    .join("\n")}`;
}

function toClarificationTotal(value: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return formatPhpAmount(value);
}

function buildStructuredClarificationOptions(input: {
  candidates: Array<{
    line_item_id: string;
    program_project_title: string;
    aip_ref_code: string | null;
    fiscal_year: number | null;
  }>;
  rowsById: Map<string, LineItemRowRecord>;
  defaultBarangayName: string | null;
}): ChatClarificationOption[] {
  const options: ChatClarificationOption[] = [];
  const seenLineItemIds = new Set<string>();

  for (const candidate of input.candidates) {
    if (seenLineItemIds.has(candidate.line_item_id)) continue;
    seenLineItemIds.add(candidate.line_item_id);

    const row = input.rowsById.get(candidate.line_item_id) ?? null;
    const title = (row?.program_project_title || candidate.program_project_title || "").trim();
    if (!title) continue;

    const refCode = (row?.aip_ref_code ?? candidate.aip_ref_code ?? "").trim() || null;
    const fiscalYear =
      typeof row?.fiscal_year === "number"
        ? row.fiscal_year
        : typeof candidate.fiscal_year === "number"
          ? candidate.fiscal_year
          : null;

    options.push({
      optionIndex: options.length + 1,
      lineItemId: candidate.line_item_id,
      title,
      refCode,
      fiscalYear,
      barangayName: input.defaultBarangayName,
      total: toClarificationTotal(row?.total ?? null),
    });

    if (options.length >= 3) break;
  }

  return options;
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

function toTopProjectRows(value: unknown): RpcTopProjectRow[] {
  if (!Array.isArray(value)) return [];
  const rows: RpcTopProjectRow[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const typed = row as Partial<RpcTopProjectRow>;
    if (!typed.line_item_id || !typed.aip_id || !typed.program_project_title) continue;
    rows.push({
      line_item_id: typed.line_item_id,
      aip_id: typed.aip_id,
      fiscal_year: toNumberOrNull(typed.fiscal_year),
      barangay_id: typeof typed.barangay_id === "string" ? typed.barangay_id : null,
      aip_ref_code: typeof typed.aip_ref_code === "string" ? typed.aip_ref_code : null,
      program_project_title: typed.program_project_title,
      fund_source: typeof typed.fund_source === "string" ? typed.fund_source : null,
      start_date: typeof typed.start_date === "string" ? typed.start_date : null,
      end_date: typeof typed.end_date === "string" ? typed.end_date : null,
      total: typed.total ?? null,
      page_no: toNumberOrNull(typed.page_no),
      row_no: toNumberOrNull(typed.row_no),
      table_no: toNumberOrNull(typed.table_no),
    });
  }
  return rows;
}

function toTotalsBySectorRows(value: unknown): RpcTotalsBySectorRow[] {
  if (!Array.isArray(value)) return [];
  const rows: RpcTotalsBySectorRow[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const typed = row as Partial<RpcTotalsBySectorRow>;
    rows.push({
      sector_code: typeof typed.sector_code === "string" ? typed.sector_code : null,
      sector_name: typeof typed.sector_name === "string" ? typed.sector_name : null,
      sector_total: typed.sector_total ?? null,
      count_items: typed.count_items ?? null,
    });
  }
  return rows;
}

function toTotalsByFundSourceRows(value: unknown): RpcTotalsByFundSourceRow[] {
  if (!Array.isArray(value)) return [];
  const rows: RpcTotalsByFundSourceRow[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const typed = row as Partial<RpcTotalsByFundSourceRow>;
    rows.push({
      fund_source: typeof typed.fund_source === "string" ? typed.fund_source : null,
      fund_total: typed.fund_total ?? null,
      count_items: typed.count_items ?? null,
    });
  }
  return rows;
}

function toCompareTotalsRow(value: unknown): RpcCompareFiscalYearTotalsRow | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value[0];
  if (!first || typeof first !== "object") return null;
  const typed = first as Partial<RpcCompareFiscalYearTotalsRow>;
  return {
    year_a_total: typed.year_a_total ?? null,
    year_b_total: typed.year_b_total ?? null,
    delta: typed.delta ?? null,
  };
}

function formatScheduleRange(startDate: string | null, endDate: string | null): string {
  const start = startDate?.trim() ?? "";
  const end = endDate?.trim() ?? "";
  if (start && end) return `${start}..${end}`;
  if (start) return `${start}..N/A`;
  if (end) return `N/A..${end}`;
  return "N/A";
}

function hasAggregationGlobalCue(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("all barangays") ||
    normalized.includes("across all barangays") ||
    normalized.includes("all published aips") ||
    normalized.includes("city-wide") ||
    normalized.includes("citywide")
  );
}

function isFundSourceListQuery(message: string): boolean {
  const normalized = message.toLowerCase();
  const hasFundTopic =
    normalized.includes("fund source") ||
    normalized.includes("fund sources") ||
    normalized.includes("funding source") ||
    normalized.includes("source of funds") ||
    normalized.includes("sources of funds");
  if (!hasFundTopic) return false;

  return (
    normalized.includes("exist") ||
    normalized.includes("available") ||
    normalized.includes("list") ||
    normalized.includes("show") ||
    normalized.includes("what are")
  );
}

function parseInteger(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
}

type AggregationScopeDecision = {
  scopeReason: LineItemScopeReason;
  barangayIdUsed: string | null;
  barangayName: string | null;
  unsupportedScopeType: ScopeType | null;
  clarificationMessage?: string;
};

type AggregationLogIntent =
  | "aggregate_top_projects"
  | "aggregate_totals_by_sector"
  | "aggregate_totals_by_fund_source"
  | "aggregate_compare_years";

async function resolveAggregationScopeDecision(input: {
  message: string;
  scopeResolution: ChatScopeResolution;
  userBarangay: BarangayRef | null;
}): Promise<AggregationScopeDecision> {
  if (input.scopeResolution.mode === "named_scopes") {
    const target =
      input.scopeResolution.resolvedTargets.length === 1
        ? input.scopeResolution.resolvedTargets[0]
        : null;
    if (target?.scopeType === "barangay") {
      return {
        scopeReason: "explicit_barangay",
        barangayIdUsed: target.scopeId,
        barangayName: target.scopeName,
        unsupportedScopeType: null,
      };
    }

    if (target?.scopeType === "city" || target?.scopeType === "municipality") {
      return {
        scopeReason: "unknown",
        barangayIdUsed: null,
        barangayName: null,
        unsupportedScopeType: target.scopeType,
      };
    }
  }

  let cachedBarangays: BarangayRef[] | null = null;
  const getActiveBarangays = async (): Promise<BarangayRef[]> => {
    if (cachedBarangays) return cachedBarangays;
    cachedBarangays = await fetchActiveBarangaysForMatching();
    return cachedBarangays;
  };

  const explicitMentionCandidate = detectExplicitBarangayMention(input.message);
  if (explicitMentionCandidate) {
    const barangays = await getActiveBarangays();
    const match = resolveExplicitBarangayByCandidate(explicitMentionCandidate, barangays);
    if (match.status === "single" && match.barangay) {
      return {
        scopeReason: "explicit_barangay",
        barangayIdUsed: match.barangay.id,
        barangayName: match.barangay.name,
        unsupportedScopeType: null,
      };
    }

    if (match.status === "ambiguous") {
      return {
        scopeReason: "unknown",
        barangayIdUsed: null,
        barangayName: null,
        unsupportedScopeType: null,
        clarificationMessage:
          "I found multiple barangays with that name. Please specify the exact barangay name.",
      };
    }
  }

  const shouldCheckBareMention =
    /\b(?:barangay|brgy\.?)\b/i.test(input.message) || /\b(?:of|for|in)\s+[a-z]/i.test(input.message);
  if (shouldCheckBareMention) {
    const barangays = await getActiveBarangays();
    const knownBarangayNamesNormalized = new Set(
      barangays
        .map((barangay) => normalizeBarangayNameForMatch(barangay.name))
        .filter((normalizedName) => Boolean(normalizedName))
    );
    const bareMentionCandidate = detectBareBarangayScopeMention(
      input.message,
      knownBarangayNamesNormalized
    );
    if (bareMentionCandidate) {
      const match = resolveExplicitBarangayByCandidate(bareMentionCandidate, barangays);
      if (match.status === "single" && match.barangay) {
        return {
          scopeReason: "explicit_barangay",
          barangayIdUsed: match.barangay.id,
          barangayName: match.barangay.name,
          unsupportedScopeType: null,
        };
      }

      if (match.status === "ambiguous") {
        return {
          scopeReason: "unknown",
          barangayIdUsed: null,
          barangayName: null,
          unsupportedScopeType: null,
          clarificationMessage:
            "I found multiple barangays with that name. Please specify the exact barangay name.",
        };
      }
    }
  }

  if (hasAggregationGlobalCue(input.message)) {
    return {
      scopeReason: "global",
      barangayIdUsed: null,
      barangayName: null,
      unsupportedScopeType: null,
    };
  }

  if (input.scopeResolution.mode === "own_barangay" && input.userBarangay) {
    return {
      scopeReason: "explicit_our_barangay",
      barangayIdUsed: input.userBarangay.id,
      barangayName: input.userBarangay.name,
      unsupportedScopeType: null,
    };
  }

  return {
    scopeReason: "global",
    barangayIdUsed: null,
    barangayName: null,
    unsupportedScopeType: null,
  };
}

function toAggregationLogIntent(intent: "top_projects" | "totals_by_sector" | "totals_by_fund_source" | "compare_years"): AggregationLogIntent {
  if (intent === "top_projects") return "aggregate_top_projects";
  if (intent === "totals_by_sector") return "aggregate_totals_by_sector";
  if (intent === "totals_by_fund_source") return "aggregate_totals_by_fund_source";
  return "aggregate_compare_years";
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

function logNonTotalsRouting(payload: NonTotalsRoutingLogPayload): void {
  if (!isTotalsDebugEnabled()) return;
  console.info(JSON.stringify(payload));
}

function logClarificationLifecycle(payload: ClarificationLifecycleLogPayload): void {
  if (!isTotalsDebugEnabled()) return;
  console.info(JSON.stringify(payload));
}

function toResponseStatus(
  retrievalMeta: ChatRetrievalMeta | null | undefined
): { status: ChatResponseStatus; clarification?: ChatClarificationPayload } {
  if (!retrievalMeta) {
    return { status: "answer" };
  }

  if (retrievalMeta.status === "clarification" || retrievalMeta.kind === "clarification") {
    return {
      status: "clarification",
      clarification: retrievalMeta.clarification
        ? {
            id: retrievalMeta.clarification.id,
            kind: retrievalMeta.clarification.kind,
            prompt: retrievalMeta.clarification.prompt,
            options: retrievalMeta.clarification.options,
          }
        : undefined,
    };
  }

  if (retrievalMeta.status === "refusal" || retrievalMeta.refused) {
    return { status: "refusal" };
  }

  return { status: "answer" };
}

function chatResponsePayload(input: {
  sessionId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}): {
  sessionId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  status: ChatResponseStatus;
  clarification?: ChatClarificationPayload;
} {
  const mapped = toResponseStatus(input.assistantMessage.retrievalMeta ?? null);
  return {
    sessionId: input.sessionId,
    userMessage: input.userMessage,
    assistantMessage: input.assistantMessage,
    status: mapped.status,
    ...(mapped.clarification ? { clarification: mapped.clarification } : {}),
  };
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

async function getLatestPendingClarification(
  sessionId: string
): Promise<PendingClarificationRecord | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("chat_messages")
    .select("id,retrieval_meta")
    .eq("session_id", sessionId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as AssistantMetaRow;
  const retrievalMeta = row.retrieval_meta as ChatRetrievalMeta | null;
  if (!retrievalMeta || typeof retrievalMeta !== "object") return null;
  if (retrievalMeta.kind !== "clarification" && retrievalMeta.status !== "clarification") return null;
  if (!retrievalMeta.clarification) return null;
  if (
    retrievalMeta.clarification.kind !== "line_item_disambiguation" ||
    !retrievalMeta.clarification.id ||
    !Array.isArray(retrievalMeta.clarification.options) ||
    retrievalMeta.clarification.options.length === 0
  ) {
    return null;
  }

  return {
    messageId: row.id,
    payload: retrievalMeta.clarification,
  };
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

async function fetchBarangayNameMap(barangayIds: string[]): Promise<Map<string, string>> {
  const deduped = barangayIds.filter((id, index, all) => id && all.indexOf(id) === index);
  if (deduped.length === 0) return new Map<string, string>();

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("barangays")
    .select("id,name")
    .in("id", deduped);

  if (error) throw new Error(error.message);

  const nameMap = new Map<string, string>();
  for (const row of data ?? []) {
    const typed = row as ScopeLookupRow;
    const name = (typed.name ?? "").trim();
    if (typed.id && name) {
      nameMap.set(typed.id, name);
    }
  }
  return nameMap;
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
  let cachedBarangays: BarangayRef[] | null = null;
  const getActiveBarangays = async (): Promise<BarangayRef[]> => {
    if (cachedBarangays) return cachedBarangays;
    cachedBarangays = await fetchActiveBarangaysForMatching();
    return cachedBarangays;
  };

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
    const barangays = await getActiveBarangays();
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

  const barangays = await getActiveBarangays();
  const knownBarangayNamesNormalized = new Set(
    barangays
      .map((barangay) => normalizeBarangayNameForMatch(barangay.name))
      .filter((normalizedName) => Boolean(normalizedName))
  );
  const bareMentionCandidate = detectBareBarangayScopeMention(
    input.message,
    knownBarangayNamesNormalized
  );
  if (bareMentionCandidate) {
    const match = resolveExplicitBarangayByCandidate(bareMentionCandidate, barangays);
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
      logNonTotalsRouting({
        request_id: requestId,
        intent: "clarification_needed",
        route: "row_sql",
        fiscal_year_parsed: extractFiscalYear(content),
        scope_reason: "unknown",
        barangay_id_used: null,
        match_count_used: null,
        top_candidate_ids: [],
        top_candidate_distances: [],
        answered: true,
        vector_called: false,
      });

      return NextResponse.json(
        chatResponsePayload({
          sessionId: session.id,
          userMessage,
          assistantMessage,
        }),
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
        chatResponsePayload({
          sessionId: session.id,
          userMessage,
          assistantMessage,
        }),
        { status: 200 }
      );
    }

    if (!scope.retrievalScope) {
      throw new Error("Retrieval scope missing for non-totals intent.");
    }

    const parsedLineItemQuestion = parseLineItemQuestion(content);
    const requestedFiscalYear = extractFiscalYear(content);
    const aggregationIntent = detectAggregationIntent(content);
    const shouldDeferAggregation =
      aggregationIntent.intent === "totals_by_fund_source" && isLineItemSpecificQuery(content);
    const userBarangay = await resolveUserBarangay(actor);
    const lineItemScope = resolveLineItemScopeDecision({
      question: parsedLineItemQuestion,
      scopeResolution: {
        mode: scopeResolution.mode,
        resolvedTargets: scopeResolution.resolvedTargets,
      },
      userBarangayId: userBarangay?.id ?? null,
    });
    const explicitBarangayTarget =
      scopeResolution.resolvedTargets.find((target) => target.scopeType === "barangay") ?? null;
    const scopeBarangayName =
      lineItemScope.scopeReason === "explicit_barangay"
        ? explicitBarangayTarget?.scopeName ?? userBarangay?.name ?? null
        : lineItemScope.scopeReason === "explicit_our_barangay" ||
            lineItemScope.scopeReason === "default_user_barangay"
          ? userBarangay?.name ?? explicitBarangayTarget?.scopeName ?? null
          : null;

    const pendingClarification = await getLatestPendingClarification(session.id);
    if (pendingClarification) {
      const selection = parseClarificationSelection(content);
      const selectedOption =
        selection !== null
          ? resolveClarificationOptionFromSelection({
              selection,
              options: pendingClarification.payload.options,
            })
          : null;

      if (selectedOption) {
        const { data: selectedRowData, error: selectedRowError } = await client
          .from("aip_line_items")
          .select(
            "id,aip_id,fiscal_year,barangay_id,aip_ref_code,program_project_title,implementing_agency,start_date,end_date,fund_source,ps,mooe,co,fe,total,expected_output,page_no,row_no,table_no"
          )
          .eq("id", selectedOption.lineItemId)
          .maybeSingle();
        if (selectedRowError) {
          throw new Error(selectedRowError.message);
        }

        const selectedRows = toLineItemRows(selectedRowData ? [selectedRowData] : []);
        if (selectedRows.length > 0) {
          const resolvedRow = selectedRows[0];
          const contextFactFields = parseFactFields(
            pendingClarification.payload.context?.factFields
          );
          const factFields =
            contextFactFields.length > 0
              ? contextFactFields
              : parsedLineItemQuestion.factFields;

          const contextScopeReason = pendingClarification.payload.context?.scopeReason;
          const resolvedScopeReason =
            contextScopeReason === "explicit_barangay" ||
            contextScopeReason === "explicit_our_barangay" ||
            contextScopeReason === "default_user_barangay" ||
            contextScopeReason === "global" ||
            contextScopeReason === "unknown"
              ? contextScopeReason
              : lineItemScope.scopeReason;

          const resolvedBarangayName =
            pendingClarification.payload.context?.barangayName ?? scopeBarangayName;

          const scopeDisclosure = buildLineItemScopeDisclosure({
            scopeReason: resolvedScopeReason,
            barangayName: resolvedBarangayName,
          });

          const assistantContent = buildLineItemAnswer({
            row: resolvedRow,
            fields: factFields,
            scopeDisclosure,
          });

          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content: assistantContent,
            citations: [
              {
                sourceId: "L1",
                aipId: resolvedRow.aip_id,
                fiscalYear: resolvedRow.fiscal_year,
                scopeType: resolvedRow.barangay_id ? "barangay" : "unknown",
                scopeId: resolvedRow.barangay_id,
                scopeName: buildLineItemCitationScopeName({
                  title: resolvedRow.program_project_title,
                  fiscalYear: resolvedRow.fiscal_year,
                  barangayName: resolvedBarangayName,
                  scopeReason: resolvedScopeReason,
                }),
                snippet: buildLineItemCitationSnippet(resolvedRow),
                insufficient: false,
                metadata: {
                  type: "aip_line_item",
                  line_item_id: resolvedRow.id,
                  aip_ref_code: resolvedRow.aip_ref_code,
                  page_no: resolvedRow.page_no,
                  row_no: resolvedRow.row_no,
                  table_no: resolvedRow.table_no,
                  aip_id: resolvedRow.aip_id,
                  fiscal_year: resolvedRow.fiscal_year,
                  barangay_id: resolvedRow.barangay_id,
                  total: formatPhpAmount(resolvedRow.total),
                },
              },
            ],
            retrievalMeta: {
              refused: false,
              reason: "ok",
              status: "answer",
              kind: "clarification_resolved",
              scopeResolution,
              latencyMs: Date.now() - startedAt,
              clarificationResolution: {
                clarificationId: pendingClarification.payload.id,
                selectedLineItemId: resolvedRow.id,
              },
            },
          });

          logClarificationLifecycle({
            request_id: requestId,
            event: "clarification_resolved",
            session_id: session.id,
            clarification_id: pendingClarification.payload.id,
            selected_line_item_id: resolvedRow.id,
          });
          logNonTotalsRouting({
            request_id: requestId,
            intent: "line_item_fact",
            route: "row_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: resolvedScopeReason,
            barangay_id_used: lineItemScope.barangayIdUsed,
            match_count_used: null,
            top_candidate_ids: [resolvedRow.id],
            top_candidate_distances: [],
            answered: true,
            vector_called: false,
          });

          return NextResponse.json(chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }), { status: 200 });
        }
      }

      if (!selectedOption && isClarificationCancelMessage(content)) {
        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content: "Okay - please restate the project title or provide the Ref code.",
          citations: [
            makeSystemCitation("Clarification flow cancelled by user.", {
              reason: "clarification_cancelled",
              clarification_id: pendingClarification.payload.id,
            }),
          ],
          retrievalMeta: {
            refused: false,
            reason: "ok",
            status: "answer",
            kind: "clarification_resolved",
            scopeResolution,
            latencyMs: Date.now() - startedAt,
          },
        });
        logNonTotalsRouting({
          request_id: requestId,
          intent: "clarification_needed",
          route: "row_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: lineItemScope.scopeReason,
          barangay_id_used: lineItemScope.barangayIdUsed,
          match_count_used: null,
          top_candidate_ids: [],
          top_candidate_distances: [],
          answered: true,
          vector_called: false,
        });

        return NextResponse.json(chatResponsePayload({
          sessionId: session.id,
          userMessage,
          assistantMessage,
        }), { status: 200 });
      }

      if (!selectedOption && isShortClarificationInput(content)) {
        const reminderPayload: ChatClarificationPayload = {
          id: pendingClarification.payload.id,
          kind: pendingClarification.payload.kind,
          prompt: "Please reply with 1-3, or type the Ref code.",
          options: pendingClarification.payload.options,
        };

        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content: buildClarificationPromptContent(reminderPayload),
          citations: [
            makeSystemCitation("Clarification reminder: awaiting valid selection.", {
              reason: "clarification_selection_required",
              clarification_id: pendingClarification.payload.id,
            }),
          ],
          retrievalMeta: {
            refused: false,
            reason: "clarification_needed",
            status: "clarification",
            kind: "clarification",
            clarification: {
              ...reminderPayload,
              context: pendingClarification.payload.context,
            },
            scopeResolution,
            latencyMs: Date.now() - startedAt,
          },
        });
        logNonTotalsRouting({
          request_id: requestId,
          intent: "clarification_needed",
          route: "row_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: lineItemScope.scopeReason,
          barangay_id_used: lineItemScope.barangayIdUsed,
          match_count_used: null,
          top_candidate_ids: pendingClarification.payload.options.map((option) => option.lineItemId),
          top_candidate_distances: [],
          answered: true,
          vector_called: false,
        });

        return NextResponse.json(chatResponsePayload({
          sessionId: session.id,
          userMessage,
          assistantMessage,
        }), { status: 200 });
      }
    }

    if (aggregationIntent.intent !== "none" && !shouldDeferAggregation) {
      const aggregationScope = await resolveAggregationScopeDecision({
        message: content,
        scopeResolution,
        userBarangay,
      });
      const aggregationLogIntent = toAggregationLogIntent(aggregationIntent.intent);
      const fiscalYearForAggregation =
        aggregationIntent.intent === "compare_years" ? null : requestedFiscalYear;
      const aggregationLimit =
        aggregationIntent.intent === "top_projects" ? aggregationIntent.limit ?? 10 : null;

      if (aggregationScope.clarificationMessage) {
        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content: aggregationScope.clarificationMessage,
          citations: [
            makeSystemCitation("Aggregation scope clarification required.", {
              reason: "aggregation_scope_ambiguous_barangay_name",
            }),
          ],
          retrievalMeta: {
            refused: false,
            reason: "clarification_needed",
            status: "clarification",
            scopeResolution,
            latencyMs: Date.now() - startedAt,
          },
        });
        logNonTotalsRouting({
          request_id: requestId,
          intent: aggregationLogIntent,
          route: "aggregate_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: aggregationScope.scopeReason,
          barangay_id_used: null,
          match_count_used: null,
          limit_used: aggregationLimit,
          top_candidate_ids: [],
          top_candidate_distances: [],
          answered: true,
          vector_called: false,
        });

        return NextResponse.json(
          chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }),
          { status: 200 }
        );
      }

      if (aggregationScope.unsupportedScopeType === "city" || aggregationScope.unsupportedScopeType === "municipality") {
        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content:
            "I can aggregate by one barangay or across all barangays. Please specify a barangay or say 'across all barangays'.",
          citations: [
            makeSystemCitation("Aggregation scope clarification required for non-barangay place scope.", {
              reason: "aggregation_scope_requires_barangay_or_global",
              requested_scope_type: aggregationScope.unsupportedScopeType,
            }),
          ],
          retrievalMeta: {
            refused: false,
            reason: "clarification_needed",
            status: "clarification",
            scopeResolution,
            latencyMs: Date.now() - startedAt,
          },
        });
        logNonTotalsRouting({
          request_id: requestId,
          intent: aggregationLogIntent,
          route: "aggregate_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: aggregationScope.scopeReason,
          barangay_id_used: null,
          match_count_used: null,
          limit_used: aggregationLimit,
          top_candidate_ids: [],
          top_candidate_distances: [],
          answered: true,
          vector_called: false,
        });

        return NextResponse.json(
          chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }),
          { status: 200 }
        );
      }

      const scopeLabel = aggregationScope.barangayIdUsed
        ? normalizeBarangayLabel(aggregationScope.barangayName ?? "your barangay")
        : "All barangays";
      const fiscalLabel = fiscalYearForAggregation === null ? "All fiscal years" : `FY ${fiscalYearForAggregation}`;

      try {
        if (aggregationIntent.intent === "top_projects") {
          const { data, error } = await client.rpc("get_top_projects", {
            p_limit: aggregationLimit,
            p_fiscal_year: fiscalYearForAggregation,
            p_barangay_id: aggregationScope.barangayIdUsed,
          });
          if (error) {
            throw new Error(error.message);
          }

          const rows = toTopProjectRows(data);
          if (rows.length === 0) {
            const assistantMessage = await appendAssistantMessage({
              sessionId: session.id,
              content: "No published AIP line items matched the selected filters.",
              citations: [
                makeAggregateCitation("Aggregated from published AIP line items.", {
                  aggregated: true,
                  aggregate_type: "top_projects",
                  source: "aip_line_items",
                  fiscal_year_filter: fiscalYearForAggregation,
                  barangay_id_filter: aggregationScope.barangayIdUsed,
                }),
              ],
              retrievalMeta: {
                refused: false,
                reason: "ok",
                scopeResolution,
                latencyMs: Date.now() - startedAt,
              },
            });
            logNonTotalsRouting({
              request_id: requestId,
              intent: aggregationLogIntent,
              route: "aggregate_sql",
              fiscal_year_parsed: requestedFiscalYear,
              scope_reason: aggregationScope.scopeReason,
              barangay_id_used: aggregationScope.barangayIdUsed,
              match_count_used: null,
              limit_used: aggregationLimit,
              top_candidate_ids: [],
              top_candidate_distances: [],
              answered: true,
              vector_called: false,
            });

            return NextResponse.json(
              chatResponsePayload({
                sessionId: session.id,
                userMessage,
                assistantMessage,
              }),
              { status: 200 }
            );
          }

          const topBarangayMap =
            aggregationScope.barangayIdUsed === null
              ? await fetchBarangayNameMap(
                  rows
                    .map((row) => row.barangay_id)
                    .filter((barangayId): barangayId is string => Boolean(barangayId))
                )
              : new Map<string, string>();
          if (aggregationScope.barangayIdUsed && aggregationScope.barangayName) {
            topBarangayMap.set(aggregationScope.barangayIdUsed, aggregationScope.barangayName);
          }

          const listLines = rows.map((row, index) => {
            const total = formatPhpAmount(toNumberOrNull(row.total));
            const fund = (row.fund_source ?? "Unspecified").trim() || "Unspecified";
            const fyLabel = typeof row.fiscal_year === "number" ? `FY ${row.fiscal_year}` : "FY Any";
            const refLabel = row.aip_ref_code ? `Ref ${row.aip_ref_code}` : "Ref N/A";
            const rowBarangayName =
              row.barangay_id && topBarangayMap.has(row.barangay_id)
                ? normalizeBarangayLabel(topBarangayMap.get(row.barangay_id) ?? "")
                : row.barangay_id
                  ? `Barangay ID ${row.barangay_id}`
                  : "All barangays";
            return `${index + 1}. ${row.program_project_title} — ${total} — ${fund} — ${fyLabel} — ${rowBarangayName} — ${refLabel}`;
          });

          const assistantContent =
            `Top ${rows.length} projects by total (${scopeLabel}; ${fiscalLabel}):\n` +
            listLines.join("\n");

          const citations: ChatCitation[] = rows.map((row, index) => {
            const rowFiscalYear = typeof row.fiscal_year === "number" ? row.fiscal_year : null;
            const rowBarangayName =
              row.barangay_id && topBarangayMap.has(row.barangay_id)
                ? normalizeBarangayLabel(topBarangayMap.get(row.barangay_id) ?? "")
                : aggregationScope.barangayName
                  ? normalizeBarangayLabel(aggregationScope.barangayName)
                  : "All barangays";
            const scopeName =
              row.barangay_id || aggregationScope.barangayIdUsed
                ? `${rowBarangayName} — FY ${rowFiscalYear ?? "Any"} — ${row.program_project_title}`
                : `All barangays — FY ${rowFiscalYear ?? "Any"} — ${row.program_project_title}`;

            return {
              sourceId: `A${index + 1}`,
              aipId: row.aip_id,
              fiscalYear: rowFiscalYear,
              scopeType: row.barangay_id ? "barangay" : "unknown",
              scopeId: row.barangay_id,
              scopeName,
              snippet:
                `Total: ${formatPhpAmount(toNumberOrNull(row.total))} - ` +
                `Fund: ${(row.fund_source ?? "Unspecified").trim() || "Unspecified"} - ` +
                `Schedule: ${formatScheduleRange(row.start_date, row.end_date)} - ` +
                `Ref: ${row.aip_ref_code ?? "N/A"}`,
              insufficient: false,
              metadata: {
                type: "aip_line_item",
                aggregate_type: "top_projects",
                line_item_id: row.line_item_id,
                aip_id: row.aip_id,
                fiscal_year: row.fiscal_year,
                barangay_id: row.barangay_id,
                aip_ref_code: row.aip_ref_code,
                page_no: row.page_no,
                row_no: row.row_no,
                table_no: row.table_no,
                fiscal_year_filter: fiscalYearForAggregation,
                barangay_id_filter: aggregationScope.barangayIdUsed,
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
            },
          });
          logNonTotalsRouting({
            request_id: requestId,
            intent: aggregationLogIntent,
            route: "aggregate_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: aggregationScope.scopeReason,
            barangay_id_used: aggregationScope.barangayIdUsed,
            match_count_used: null,
            limit_used: aggregationLimit,
            top_candidate_ids: rows.slice(0, 3).map((row) => row.line_item_id),
            top_candidate_distances: [],
            answered: true,
            vector_called: false,
          });

          return NextResponse.json(
            chatResponsePayload({
              sessionId: session.id,
              userMessage,
              assistantMessage,
            }),
            { status: 200 }
          );
        }

        if (aggregationIntent.intent === "totals_by_sector") {
          const { data, error } = await client.rpc("get_totals_by_sector", {
            p_fiscal_year: fiscalYearForAggregation,
            p_barangay_id: aggregationScope.barangayIdUsed,
          });
          if (error) {
            throw new Error(error.message);
          }

          const rows = toTotalsBySectorRows(data);
          const contentLines =
            rows.length === 0
              ? ["No published AIP line items matched the selected filters."]
              : rows.map((row, index) => {
                  const label = [row.sector_code, row.sector_name].filter(Boolean).join(" - ") || "Unspecified sector";
                  return `${index + 1}. ${label}: ${formatPhpAmount(toNumberOrNull(row.sector_total))} (${parseInteger(row.count_items) ?? 0} items)`;
                });

          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content: `Budget totals by sector (${scopeLabel}; ${fiscalLabel}):\n${contentLines.join("\n")}`,
            citations: [
              makeAggregateCitation("Aggregated from published AIP line items.", {
                aggregated: true,
                source: "aip_line_items",
                aggregate_type: "totals_by_sector",
                fiscal_year_filter: fiscalYearForAggregation,
                barangay_id_filter: aggregationScope.barangayIdUsed,
              }),
            ],
            retrievalMeta: {
              refused: false,
              reason: "ok",
              scopeResolution,
              latencyMs: Date.now() - startedAt,
            },
          });
          logNonTotalsRouting({
            request_id: requestId,
            intent: aggregationLogIntent,
            route: "aggregate_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: aggregationScope.scopeReason,
            barangay_id_used: aggregationScope.barangayIdUsed,
            match_count_used: null,
            limit_used: null,
            top_candidate_ids: [],
            top_candidate_distances: [],
            answered: true,
            vector_called: false,
          });

          return NextResponse.json(
            chatResponsePayload({
              sessionId: session.id,
              userMessage,
              assistantMessage,
            }),
            { status: 200 }
          );
        }

        if (aggregationIntent.intent === "totals_by_fund_source") {
          const { data, error } = await client.rpc("get_totals_by_fund_source", {
            p_fiscal_year: fiscalYearForAggregation,
            p_barangay_id: aggregationScope.barangayIdUsed,
          });
          if (error) {
            throw new Error(error.message);
          }

          const rows = toTotalsByFundSourceRows(data);
          const listOnly = isFundSourceListQuery(content);
          const contentLines =
            rows.length === 0
              ? ["No published AIP line items matched the selected filters."]
              : listOnly
                ? Array.from(
                    new Set(
                      rows
                        .map((row) => (row.fund_source ?? "Unspecified").trim() || "Unspecified")
                        .sort((a, b) => a.localeCompare(b))
                    )
                  ).map((label, index) => `${index + 1}. ${label}`)
                : rows.map((row, index) => {
                    const label = (row.fund_source ?? "Unspecified").trim() || "Unspecified";
                    return `${index + 1}. ${label}: ${formatPhpAmount(toNumberOrNull(row.fund_total))} (${parseInteger(row.count_items) ?? 0} items)`;
                  });

          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content: listOnly
              ? `Fund sources (${scopeLabel}; ${fiscalLabel}):\n${contentLines.join("\n")}`
              : `Budget totals by fund source (${scopeLabel}; ${fiscalLabel}):\n${contentLines.join("\n")}`,
            citations: [
              makeAggregateCitation("Aggregated from published AIP line items.", {
                aggregated: true,
                source: "aip_line_items",
                aggregate_type: "totals_by_fund_source",
                fiscal_year_filter: fiscalYearForAggregation,
                barangay_id_filter: aggregationScope.barangayIdUsed,
                output_mode: listOnly ? "fund_source_list" : "totals_with_counts",
              }),
            ],
            retrievalMeta: {
              refused: false,
              reason: "ok",
              scopeResolution,
              latencyMs: Date.now() - startedAt,
            },
          });
          logNonTotalsRouting({
            request_id: requestId,
            intent: aggregationLogIntent,
            route: "aggregate_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: aggregationScope.scopeReason,
            barangay_id_used: aggregationScope.barangayIdUsed,
            match_count_used: null,
            limit_used: null,
            top_candidate_ids: [],
            top_candidate_distances: [],
            answered: true,
            vector_called: false,
          });

          return NextResponse.json(
            chatResponsePayload({
              sessionId: session.id,
              userMessage,
              assistantMessage,
            }),
            { status: 200 }
          );
        }

        const yearA = aggregationIntent.yearA ?? null;
        const yearB = aggregationIntent.yearB ?? null;
        if (yearA === null || yearB === null) {
          throw new Error("Aggregation compare years intent requires two years.");
        }

        const { data, error } = await client.rpc("compare_fiscal_year_totals", {
          p_year_a: yearA,
          p_year_b: yearB,
          p_barangay_id: aggregationScope.barangayIdUsed,
        });
        if (error) {
          throw new Error(error.message);
        }

        const comparison = toCompareTotalsRow(data);
        const yearATotal = toNumberOrNull(comparison?.year_a_total) ?? 0;
        const yearBTotal = toNumberOrNull(comparison?.year_b_total) ?? 0;
        const delta = toNumberOrNull(comparison?.delta) ?? yearBTotal - yearATotal;
        const deltaPhrase =
          delta > 0
            ? `an increase of ${formatPhpAmount(delta)}`
            : delta < 0
              ? `a decrease of ${formatPhpAmount(Math.abs(delta))}`
              : "no change";

        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content:
            `Fiscal year comparison (${scopeLabel}): FY ${yearA} = ${formatPhpAmount(yearATotal)}; ` +
            `FY ${yearB} = ${formatPhpAmount(yearBTotal)}; difference = ${deltaPhrase}.`,
          citations: [
            makeAggregateCitation("Aggregated from published AIP line items.", {
              aggregated: true,
              source: "aip_line_items",
              aggregate_type: "compare_fiscal_year_totals",
              year_a: yearA,
              year_b: yearB,
              barangay_id_filter: aggregationScope.barangayIdUsed,
            }),
          ],
          retrievalMeta: {
            refused: false,
            reason: "ok",
            scopeResolution,
            latencyMs: Date.now() - startedAt,
          },
        });
        logNonTotalsRouting({
          request_id: requestId,
          intent: aggregationLogIntent,
          route: "aggregate_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: aggregationScope.scopeReason,
          barangay_id_used: aggregationScope.barangayIdUsed,
          match_count_used: null,
          limit_used: null,
          top_candidate_ids: [],
          top_candidate_distances: [],
          answered: true,
          vector_called: false,
        });

        return NextResponse.json(
          chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }),
          { status: 200 }
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Aggregation query failed.";
        const assistantMessage = await appendAssistantMessage({
          sessionId: session.id,
          content:
            "I couldn't complete the aggregate SQL query due to a temporary system issue. Please try again shortly.",
          citations: [makeSystemCitation("Aggregate SQL query failed.", { error: message })],
          retrievalMeta: {
            refused: true,
            reason: "pipeline_error",
            scopeResolution,
            latencyMs: Date.now() - startedAt,
          },
        });
        logNonTotalsRouting({
          request_id: requestId,
          intent: aggregationLogIntent,
          route: "aggregate_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: aggregationScope.scopeReason,
          barangay_id_used: aggregationScope.barangayIdUsed,
          match_count_used: null,
          limit_used: aggregationLimit,
          top_candidate_ids: [],
          top_candidate_distances: [],
          answered: false,
          vector_called: false,
        });

        return NextResponse.json(
          chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }),
          { status: 200 }
        );
      }
    }

    if (parsedLineItemQuestion.isUnanswerableFieldQuestion && !parsedLineItemQuestion.isFactQuestion) {
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
      logNonTotalsRouting({
        request_id: requestId,
        intent: "unanswerable_field",
        route: "row_sql",
        fiscal_year_parsed: requestedFiscalYear,
        scope_reason: lineItemScope.scopeReason,
        barangay_id_used: lineItemScope.barangayIdUsed,
        match_count_used: null,
        top_candidate_ids: [],
        top_candidate_distances: [],
        answered: true,
        vector_called: false,
      });

      return NextResponse.json(
        chatResponsePayload({
          sessionId: session.id,
          userMessage,
          assistantMessage,
        }),
        { status: 200 }
      );
    }

    if (parsedLineItemQuestion.isFactQuestion) {
      let vectorRpcCalled = false;
      try {
        const barangayFilterId = lineItemScope.barangayIdUsed;
        const matchCount = barangayFilterId === null && requestedFiscalYear === null ? 40 : 20;
        const refCode = extractAipRefCode(content);

        if (refCode) {
          let refQuery = client
            .from("aip_line_items")
            .select(
              "id,aip_id,fiscal_year,barangay_id,aip_ref_code,program_project_title,implementing_agency,start_date,end_date,fund_source,ps,mooe,co,fe,total,expected_output,page_no,row_no,table_no"
            )
            .ilike("aip_ref_code", refCode);

          if (requestedFiscalYear !== null) {
            refQuery = refQuery.eq("fiscal_year", requestedFiscalYear);
          }
          if (barangayFilterId !== null) {
            refQuery = refQuery.eq("barangay_id", barangayFilterId);
          }

          const { data: refData, error: refError } = await refQuery.limit(30);
          if (refError) {
            throw new Error(refError.message);
          }

          let refRows = toLineItemRows(refData);
          if (refRows.length > 0) {
            const admin = supabaseAdmin();
            const candidateAipIds = refRows
              .map((row) => row.aip_id)
              .filter((aipId, index, all) => Boolean(aipId) && all.indexOf(aipId) === index);

            if (candidateAipIds.length > 0) {
              let publishedAipQuery = admin
                .from("aips")
                .select("id")
                .in("id", candidateAipIds)
                .eq("status", "published");

              if (requestedFiscalYear !== null) {
                publishedAipQuery = publishedAipQuery.eq("fiscal_year", requestedFiscalYear);
              }

              if (barangayFilterId !== null) {
                publishedAipQuery = publishedAipQuery.eq("barangay_id", barangayFilterId);
              }

              const { data: publishedAips, error: publishedError } = await publishedAipQuery;
              if (publishedError) {
                throw new Error(publishedError.message);
              }

              const publishedAipIds = new Set(
                (publishedAips ?? [])
                  .map((row) => (row as { id?: string }).id ?? null)
                  .filter((id): id is string => Boolean(id))
              );
              refRows = refRows.filter((row) => publishedAipIds.has(row.aip_id));
            } else {
              refRows = [];
            }
          }

          if (refRows.length === 0) {
            const fyLabel = requestedFiscalYear !== null ? `FY ${requestedFiscalYear}` : "any fiscal year";
            const scopeLabel =
              barangayFilterId !== null
                ? normalizeBarangayLabel(scopeBarangayName ?? "your barangay")
                : "all barangays";

            const assistantMessage = await appendAssistantMessage({
              sessionId: session.id,
              content:
                `I couldn't find a published line item with Ref ${refCode} ` +
                `(${fyLabel}; ${scopeLabel}). Please verify the Ref code or try loosening the filters.`,
              citations: [
                makeSystemCitation("No published line item matched the requested Ref code.", {
                  reason: "line_item_ref_not_found",
                  ref_code: refCode,
                  fiscal_year: requestedFiscalYear,
                  barangay_id: barangayFilterId,
                }),
              ],
              retrievalMeta: {
                refused: false,
                reason: "ok",
                scopeResolution,
                latencyMs: Date.now() - startedAt,
              },
            });
            logNonTotalsRouting({
              request_id: requestId,
              intent: "line_item_fact",
              route: "row_sql",
              fiscal_year_parsed: requestedFiscalYear,
              scope_reason: lineItemScope.scopeReason,
              barangay_id_used: lineItemScope.barangayIdUsed,
              match_count_used: null,
              top_candidate_ids: [],
              top_candidate_distances: [],
              answered: true,
              vector_called: false,
            });

            return NextResponse.json(
              chatResponsePayload({
                sessionId: session.id,
                userMessage,
                assistantMessage,
              }),
              { status: 200 }
            );
          }

          if (refRows.length === 1) {
            const selectedRow = refRows[0];
            const rowBarangayNameMap = await fetchBarangayNameMap(
              selectedRow.barangay_id ? [selectedRow.barangay_id] : []
            );
            const resolvedRowBarangayName =
              selectedRow.barangay_id && rowBarangayNameMap.has(selectedRow.barangay_id)
                ? rowBarangayNameMap.get(selectedRow.barangay_id) ?? scopeBarangayName
                : scopeBarangayName;

            const scopeDisclosure = buildLineItemScopeDisclosure({
              scopeReason: lineItemScope.scopeReason,
              barangayName: resolvedRowBarangayName,
            });
            const assistantContent = buildLineItemAnswer({
              row: selectedRow,
              fields: parsedLineItemQuestion.factFields,
              scopeDisclosure,
            });

            const assistantMessage = await appendAssistantMessage({
              sessionId: session.id,
              content: assistantContent,
              citations: [
                {
                  sourceId: "L1",
                  aipId: selectedRow.aip_id,
                  fiscalYear: selectedRow.fiscal_year,
                  scopeType: selectedRow.barangay_id ? "barangay" : "unknown",
                  scopeId: selectedRow.barangay_id,
                  scopeName: buildLineItemCitationScopeName({
                    title: selectedRow.program_project_title,
                    fiscalYear: selectedRow.fiscal_year,
                    barangayName: resolvedRowBarangayName,
                    scopeReason: lineItemScope.scopeReason,
                  }),
                  snippet: buildLineItemCitationSnippet(selectedRow),
                  insufficient: false,
                  metadata: {
                    type: "aip_line_item",
                    line_item_id: selectedRow.id,
                    aip_ref_code: selectedRow.aip_ref_code,
                    page_no: selectedRow.page_no,
                    row_no: selectedRow.row_no,
                    table_no: selectedRow.table_no,
                    aip_id: selectedRow.aip_id,
                    fiscal_year: selectedRow.fiscal_year,
                    barangay_id: selectedRow.barangay_id,
                    total: formatPhpAmount(selectedRow.total),
                    scope_reason: lineItemScope.scopeReason,
                    matched_by: "exact_ref_code",
                  },
                },
              ],
              retrievalMeta: {
                refused: false,
                reason: "ok",
                scopeResolution,
                latencyMs: Date.now() - startedAt,
                contextCount: 1,
              },
            });
            logNonTotalsRouting({
              request_id: requestId,
              intent: "line_item_fact",
              route: "row_sql",
              fiscal_year_parsed: requestedFiscalYear,
              scope_reason: lineItemScope.scopeReason,
              barangay_id_used: lineItemScope.barangayIdUsed,
              match_count_used: null,
              top_candidate_ids: [selectedRow.id],
              top_candidate_distances: [],
              answered: true,
              vector_called: false,
            });

            return NextResponse.json(
              chatResponsePayload({
                sessionId: session.id,
                userMessage,
                assistantMessage,
              }),
              { status: 200 }
            );
          }

          const limitedRows = refRows.slice(0, 3);
          const rowBarangayNameMap = await fetchBarangayNameMap(
            limitedRows
              .map((row) => row.barangay_id)
              .filter((barangayId): barangayId is string => Boolean(barangayId))
          );
          const clarificationPayload: ChatClarificationPayload = {
            id: randomUUID(),
            kind: "line_item_disambiguation",
            prompt: "I found multiple published line items with that Ref code. Which one did you mean?",
            options: limitedRows.map((row, index) => ({
              optionIndex: index + 1,
              lineItemId: row.id,
              title: row.program_project_title,
              refCode: row.aip_ref_code,
              fiscalYear: row.fiscal_year,
              barangayName:
                row.barangay_id && rowBarangayNameMap.has(row.barangay_id)
                  ? normalizeBarangayLabel(rowBarangayNameMap.get(row.barangay_id) ?? "")
                  : scopeBarangayName,
              total: toClarificationTotal(row.total),
            })),
          };

          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content: buildClarificationPromptContent(clarificationPayload),
            citations: [
              makeSystemCitation("Multiple published line-item rows share the requested Ref code.", {
                reason: "line_item_ref_ambiguous",
                ref_code: refCode,
              }),
            ],
            retrievalMeta: {
              refused: false,
              reason: "clarification_needed",
              status: "clarification",
              kind: "clarification",
              clarification: {
                ...clarificationPayload,
                context: {
                  factFields: parsedLineItemQuestion.factFields,
                  scopeReason: lineItemScope.scopeReason,
                  barangayName: scopeBarangayName,
                },
              },
              scopeResolution,
              latencyMs: Date.now() - startedAt,
              contextCount: refRows.length,
            },
          });
          logClarificationLifecycle({
            request_id: requestId,
            event: "clarification_created",
            session_id: session.id,
            clarification_id: clarificationPayload.id,
            option_count: clarificationPayload.options.length,
            top_candidate_ids: limitedRows.map((row) => row.id),
          });
          logNonTotalsRouting({
            request_id: requestId,
            intent: "clarification_needed",
            route: "row_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: lineItemScope.scopeReason,
            barangay_id_used: lineItemScope.barangayIdUsed,
            match_count_used: null,
            top_candidate_ids: limitedRows.map((row) => row.id),
            top_candidate_distances: [],
            answered: false,
            vector_called: false,
          });

          return NextResponse.json(chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }), { status: 200 });
        }

        const embeddedQuery = await requestPipelineQueryEmbedding({ text: content });

        vectorRpcCalled = true;
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
          logNonTotalsRouting({
            request_id: requestId,
            intent: "line_item_fact",
            route: "row_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: lineItemScope.scopeReason,
            barangay_id_used: lineItemScope.barangayIdUsed,
            match_count_used: matchCount,
            top_candidate_ids: [],
            top_candidate_distances: [],
            answered: false,
            vector_called: vectorRpcCalled,
          });

          return NextResponse.json(
            chatResponsePayload({
              sessionId: session.id,
              userMessage,
              assistantMessage,
            }),
            { status: 200 }
          );
        }

        const candidateIds = ranked
          .slice(0, 3)
          .map((candidate) => candidate.line_item_id)
          .filter((id, index, all) => all.indexOf(id) === index);
        const topCandidateIds = ranked.slice(0, 3).map((candidate) => candidate.line_item_id);
        const topCandidateDistances = ranked
          .slice(0, 3)
          .map((candidate) => candidate.distance)
          .filter((distance): distance is number => typeof distance === "number");

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

        if (
          shouldAskLineItemClarification({
            question: parsedLineItemQuestion,
            candidates: ranked,
          })
        ) {
          const structuredOptions = buildStructuredClarificationOptions({
            candidates: ranked,
            rowsById,
            defaultBarangayName: scopeBarangayName,
          });
          const clarificationPayload: ChatClarificationPayload = {
            id: randomUUID(),
            kind: "line_item_disambiguation",
            prompt: "Which one did you mean?",
            options: structuredOptions,
          };
          const optionsAsText = buildClarificationOptions({
            candidates: ranked,
            rowsById,
            defaultBarangayName: scopeBarangayName,
            scopeReason: lineItemScope.scopeReason,
          });
          const assistantMessage = await appendAssistantMessage({
            sessionId: session.id,
            content:
              structuredOptions.length > 0
                ? buildClarificationPromptContent(clarificationPayload)
                : `I found multiple possible line items:\n${optionsAsText
                    .map((option, index) => `${index + 1}. ${option}`)
                    .join("\n")}\nWhich one did you mean?`,
            citations: [
              makeSystemCitation("Multiple plausible line-item candidates require clarification.", {
                reason: "line_item_ambiguous",
                options: structuredOptions.length > 0 ? structuredOptions : optionsAsText,
              }),
            ],
            retrievalMeta: {
              refused: false,
              reason: "clarification_needed",
              status: "clarification",
              kind: "clarification",
              clarification: {
                ...clarificationPayload,
                context: {
                  factFields: parsedLineItemQuestion.factFields,
                  scopeReason: lineItemScope.scopeReason,
                  barangayName: scopeBarangayName,
                },
              },
              scopeResolution,
              latencyMs: Date.now() - startedAt,
              topK: matchCount,
              contextCount: ranked.length,
            },
          });
          logClarificationLifecycle({
            request_id: requestId,
            event: "clarification_created",
            session_id: session.id,
            clarification_id: clarificationPayload.id,
            option_count: clarificationPayload.options.length,
            top_candidate_ids: topCandidateIds,
          });
          logNonTotalsRouting({
            request_id: requestId,
            intent: "clarification_needed",
            route: "row_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: lineItemScope.scopeReason,
            barangay_id_used: lineItemScope.barangayIdUsed,
            match_count_used: matchCount,
            top_candidate_ids: topCandidateIds,
            top_candidate_distances: topCandidateDistances,
            answered: false,
            vector_called: vectorRpcCalled,
          });

          return NextResponse.json(chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }), { status: 200 });
        }

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
          logNonTotalsRouting({
            request_id: requestId,
            intent: "line_item_fact",
            route: "row_sql",
            fiscal_year_parsed: requestedFiscalYear,
            scope_reason: lineItemScope.scopeReason,
            barangay_id_used: lineItemScope.barangayIdUsed,
            match_count_used: matchCount,
            top_candidate_ids: topCandidateIds,
            top_candidate_distances: topCandidateDistances,
            answered: false,
            vector_called: vectorRpcCalled,
          });

          return NextResponse.json(
            chatResponsePayload({
              sessionId: session.id,
              userMessage,
              assistantMessage,
            }),
            { status: 200 }
          );
        }

        const primaryRow = selectedRows[0];
        const scopeDisclosure = buildLineItemScopeDisclosure({
          scopeReason: lineItemScope.scopeReason,
          barangayName: scopeBarangayName,
        });
        const assistantContent = buildLineItemAnswer({
          row: primaryRow,
          fields: parsedLineItemQuestion.factFields,
          scopeDisclosure,
        });

        const citations: ChatCitation[] = selectedRows.map((row, index) => {
          const rankedCandidate = ranked.find((candidate) => candidate.line_item_id === row.id) ?? null;
          return {
            sourceId: `L${index + 1}`,
            aipId: row.aip_id,
            fiscalYear: row.fiscal_year,
            scopeType: row.barangay_id ? "barangay" : "unknown",
            scopeId: row.barangay_id,
            scopeName: buildLineItemCitationScopeName({
              title: row.program_project_title,
              fiscalYear: row.fiscal_year,
              barangayName: scopeBarangayName,
              scopeReason: lineItemScope.scopeReason,
            }),
            distance: rankedCandidate?.distance ?? null,
            matchScore: rankedCandidate?.score ?? null,
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
              distance: rankedCandidate?.distance ?? null,
              score: rankedCandidate?.score ?? null,
              scope_reason: lineItemScope.scopeReason,
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
        logNonTotalsRouting({
          request_id: requestId,
          intent: "line_item_fact",
          route: "row_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: lineItemScope.scopeReason,
          barangay_id_used: lineItemScope.barangayIdUsed,
          match_count_used: matchCount,
          top_candidate_ids: topCandidateIds,
          top_candidate_distances: topCandidateDistances,
          answered: true,
          vector_called: vectorRpcCalled,
        });

        return NextResponse.json(
          chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }),
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
        logNonTotalsRouting({
          request_id: requestId,
          intent: "line_item_fact",
          route: "row_sql",
          fiscal_year_parsed: requestedFiscalYear,
          scope_reason: lineItemScope.scopeReason,
          barangay_id_used: lineItemScope.barangayIdUsed,
          match_count_used: null,
          top_candidate_ids: [],
          top_candidate_distances: [],
          answered: false,
          vector_called: vectorRpcCalled,
        });

        return NextResponse.json(
          chatResponsePayload({
            sessionId: session.id,
            userMessage,
            assistantMessage,
          }),
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
    logNonTotalsRouting({
      request_id: requestId,
      intent: "pipeline_fallback",
      route: "pipeline_fallback",
      fiscal_year_parsed: requestedFiscalYear,
      scope_reason: lineItemScope.scopeReason,
      barangay_id_used: lineItemScope.barangayIdUsed,
      match_count_used: null,
      top_candidate_ids: [],
      top_candidate_distances: [],
      answered: !assistantMeta.refused,
      vector_called: false,
    });

    return NextResponse.json(
      chatResponsePayload({
        sessionId: session.id,
        userMessage,
        assistantMessage,
      }),
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected chatbot error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
