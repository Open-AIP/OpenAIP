export type ChatIntent = "total_investment_program" | "normal";

const TOTAL_KEYWORDS = ["total investment program", "total investment", "grand total"] as const;
const YEAR_PATTERN = /\b(20\d{2})\b/;

function normalizeIntentText(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFiscalYear(message: string): number | null {
  const match = message.match(YEAR_PATTERN);
  if (!match) return null;
  const parsed = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

export function detectIntent(message: string): { intent: ChatIntent } {
  const normalized = normalizeIntentText(message);
  const hasTotalsKeyword = TOTAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const hasYearToken = extractFiscalYear(message) !== null;

  // Phase 1 default: missing FY can still route to SQL-first using latest published AIP in scope.
  const hasImpliedFiscalYearSelection = true;
  if (hasTotalsKeyword && (hasYearToken || hasImpliedFiscalYearSelection)) {
    return { intent: "total_investment_program" };
  }

  return { intent: "normal" };
}
