export type AggregationIntentResult = {
  intent: "top_projects" | "totals_by_sector" | "totals_by_fund_source" | "compare_years" | "none";
  limit?: number;
  yearA?: number;
  yearB?: number;
};

const YEAR_PATTERN = /\b(20\d{2})\b/g;

function normalizeAggregationText(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDistinctYears(message: string): number[] {
  const years: number[] = [];
  let match: RegExpExecArray | null = YEAR_PATTERN.exec(message);
  while (match) {
    const parsed = Number.parseInt(match[1] ?? "", 10);
    if (Number.isInteger(parsed) && !years.includes(parsed)) {
      years.push(parsed);
    }
    match = YEAR_PATTERN.exec(message);
  }
  YEAR_PATTERN.lastIndex = 0;
  return years;
}

function parseTopLimit(normalized: string): number {
  const match = normalized.match(/\btop\s+(\d{1,2})\b/i);
  if (!match) return 10;
  const parsed = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isInteger(parsed)) return 10;
  return Math.max(1, Math.min(parsed, 50));
}

export function detectAggregationIntent(message: string): AggregationIntentResult {
  const normalized = normalizeAggregationText(message);
  if (!normalized) return { intent: "none" };

  const years = extractDistinctYears(normalized);
  const hasCompareCue = /\b(compare|difference|vs|versus)\b/.test(normalized);
  if (hasCompareCue && years.length >= 2) {
    return {
      intent: "compare_years",
      yearA: years[0],
      yearB: years[1],
    };
  }

  const hasTopCue = /\b(top|largest|highest|most funded)\b/.test(normalized);
  const hasProjectsCue = /\b(projects|programs)\b/.test(normalized);
  if (hasTopCue && hasProjectsCue) {
    return {
      intent: "top_projects",
      limit: parseTopLimit(normalized),
    };
  }

  const hasSectorCue =
    normalized.includes("by sector") ||
    normalized.includes("per sector") ||
    normalized.includes("sector totals") ||
    normalized.includes("total by sector");
  if (hasSectorCue) {
    return { intent: "totals_by_sector" };
  }

  const hasFundCue =
    normalized.includes("by fund") ||
    normalized.includes("fund source") ||
    normalized.includes("loan vs") ||
    normalized.includes("external source") ||
    normalized.includes("general fund") ||
    normalized.includes("funding source totals");
  if (hasFundCue) {
    return { intent: "totals_by_fund_source" };
  }

  return { intent: "none" };
}
