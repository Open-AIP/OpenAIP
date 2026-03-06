import { detectAggregationIntent } from "@/lib/chat/aggregation-intent";
import { extractFiscalYear } from "@/lib/chat/intent";
import { decideRoute } from "@/lib/chat/router-decision";
import type { PipelineIntentClassification } from "@/lib/chat/types";
import type {
  QueryPlan,
  QueryPlanMissingSlot,
  QueryPlanSemanticTask,
  QueryPlanStructuredTask,
  QueryPlanStructuredTaskKind,
} from "@/lib/chat/query-plan-types";

const COMPOUND_SPLIT_PATTERN = /\b(?:and then|then|and also|and|plus|, then)\b/i;
const PART_SPLIT_PATTERN = /\b(?:and then|then|and also|plus|and)\b/i;

const SEMANTIC_CUE_PATTERNS: RegExp[] = [
  /\bexplain\b/i,
  /\bsummarize\b/i,
  /\bsummary\b/i,
  /\bwhy\b/i,
  /\bdescribe\b/i,
  /\bwhat does the aip say\b/i,
  /\bcitations?\b/i,
  /\bcite\b/i,
];

function maxStructuredTasks(): number {
  const raw = Number.parseInt(process.env.CHAT_MIXED_MAX_STRUCTURED_TASKS ?? "3", 10);
  if (!Number.isFinite(raw)) return 3;
  return Math.min(5, Math.max(1, raw));
}

function maxSemanticTasks(): number {
  const raw = Number.parseInt(process.env.CHAT_MIXED_MAX_SEMANTIC_TASKS ?? "2", 10);
  if (!Number.isFinite(raw)) return 2;
  return Math.min(3, Math.max(1, raw));
}

function normalizePart(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function containsSemanticCue(value: string): boolean {
  return SEMANTIC_CUE_PATTERNS.some((pattern) => pattern.test(value));
}

function hasCompoundShape(value: string): boolean {
  if ((value.match(/\?/g) ?? []).length >= 2) return true;
  return COMPOUND_SPLIT_PATTERN.test(value);
}

function splitSubqueries(text: string, maxParts = 3): string[] {
  const normalized = normalizePart(text);
  if (!normalized) return [];

  const questionParts = normalized
    .split("?")
    .map((part) => normalizePart(part))
    .filter(Boolean);
  const baseParts = questionParts.length > 1 ? questionParts : [normalized];

  const exploded: string[] = [];
  for (const basePart of baseParts) {
    const pieces = basePart
      .split(PART_SPLIT_PATTERN)
      .map((piece) => normalizePart(piece))
      .filter(Boolean);
    if (pieces.length <= 1) {
      exploded.push(basePart);
      continue;
    }
    exploded.push(...pieces);
  }

  const deduped = exploded.filter((part, index, all) => all.indexOf(part) === index);
  return deduped.slice(0, Math.max(1, maxParts));
}

function mapRouteKindToStructuredTaskKind(routeKind: QueryPlanStructuredTask["routeKind"]): QueryPlanStructuredTaskKind {
  if (routeKind === "SQL_TOTAL") return "totals";
  if (routeKind === "SQL_AGG") return "aggregation";
  if (routeKind === "ROW_LOOKUP") return "line_item";
  return "metadata";
}

function toMissingSlots(routeMissing: string[]): QueryPlanMissingSlot[] {
  const slots: QueryPlanMissingSlot[] = [];
  if (routeMissing.includes("fiscal_year_pair")) {
    slots.push("fiscal_year_pair");
  }
  if (routeMissing.includes("scope")) {
    slots.push("scope");
  }
  return slots;
}

function buildClarificationPrompt(missingSlots: QueryPlanMissingSlot[]): string {
  if (missingSlots.includes("fiscal_year_pair")) {
    return "Please specify two fiscal years to compare (for example: FY 2025 vs FY 2026).";
  }
  return "Please clarify the request (scope and year) before I run a mixed answer.";
}

export function buildQueryPlan(input: {
  text: string;
  intentClassification: PipelineIntentClassification | null;
}): QueryPlan {
  const effectiveQuery = normalizePart(input.text);
  if (!effectiveQuery) {
    return {
      mode: "semantic_only",
      effectiveQuery,
      structuredTasks: [],
      semanticTasks: [],
      clarificationRequired: false,
      clarificationPrompt: null,
      diagnostics: ["empty_query"],
    };
  }

  const candidateParts = hasCompoundShape(effectiveQuery)
    ? splitSubqueries(effectiveQuery, Math.max(maxStructuredTasks(), maxSemanticTasks(), 3))
    : [effectiveQuery];

  const diagnostics: string[] = [];
  const structuredTasks: QueryPlanStructuredTask[] = [];
  const semanticTasks: QueryPlanSemanticTask[] = [];

  for (const part of candidateParts) {
    const decision = decideRoute({
      text: part,
      intentClassification: input.intentClassification,
    });

    const isStructuredRoute =
      decision.kind === "SQL_TOTAL" ||
      decision.kind === "SQL_AGG" ||
      decision.kind === "ROW_LOOKUP" ||
      decision.kind === "SQL_METADATA";

    if (isStructuredRoute && structuredTasks.length < maxStructuredTasks()) {
      structuredTasks.push({
        id: `structured_${structuredTasks.length + 1}`,
        kind: mapRouteKindToStructuredTaskKind(decision.kind),
        routeKind: decision.kind,
        subquery: part,
        fiscalYear: extractFiscalYear(part),
        missingSlots: toMissingSlots(decision.missingSlots),
      });
      diagnostics.push(`structured:${decision.kind}`);
    }

    if (containsSemanticCue(part) && semanticTasks.length < maxSemanticTasks()) {
      semanticTasks.push({
        id: `semantic_${semanticTasks.length + 1}`,
        kind: "narrative",
        subquery: part,
        requiresCitations: true,
      });
      diagnostics.push("semantic:cue");
    }
  }

  if (
    structuredTasks.length > 0 &&
    semanticTasks.length === 0 &&
    containsSemanticCue(effectiveQuery) &&
    semanticTasks.length < maxSemanticTasks()
  ) {
    semanticTasks.push({
      id: `semantic_${semanticTasks.length + 1}`,
      kind: "narrative",
      subquery: effectiveQuery,
      requiresCitations: true,
    });
    diagnostics.push("semantic:query_level_cue");
  }

  const clarificationMissingSlots = Array.from(
    new Set(
      structuredTasks
        .flatMap((task) => task.missingSlots)
        .filter((slot): slot is QueryPlanMissingSlot => slot === "fiscal_year_pair" || slot === "scope")
    )
  );

  const clarificationRequired = clarificationMissingSlots.length > 0;
  const clarificationPrompt = clarificationRequired
    ? buildClarificationPrompt(clarificationMissingSlots)
    : null;

  const mode: QueryPlan["mode"] =
    structuredTasks.length > 0 && semanticTasks.length > 0
      ? "mixed"
      : structuredTasks.length > 0
        ? "structured_only"
        : "semantic_only";

  if (mode === "structured_only" && detectAggregationIntent(effectiveQuery).intent === "none") {
    diagnostics.push("structured_only_single_route");
  }

  if (mode === "semantic_only") {
    diagnostics.push("semantic_only_single_route");
  }

  return {
    mode,
    effectiveQuery,
    structuredTasks,
    semanticTasks,
    clarificationRequired,
    clarificationPrompt,
    diagnostics,
  };
}
