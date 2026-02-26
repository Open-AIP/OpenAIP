const TOTAL_KEYWORD_PATTERN = /total\s+investment\s+program/i;
const GRAND_TOTAL_PATTERN = /investment[\s|]+program[\s|]+grand\s+total/i;
const FOOTER_PATTERN = /\b(?:Prepared by|Approved by|Reviewed by|Noted by)\b/i;
const MONEY_PATTERN = /(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})|\d+(?:\.\d{1,2})?)/g;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function trimToMax(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).trim();
}

function stripFooterSegments(value: string): string {
  const footerMatch = FOOTER_PATTERN.exec(value);
  if (footerMatch && typeof footerMatch.index === "number") {
    return value.slice(0, footerMatch.index);
  }
  return value;
}

function extractCandidate(original: string): { text: string; hasTotalKeyword: boolean } | null {
  const keywordMatch = TOTAL_KEYWORD_PATTERN.exec(original);
  if (keywordMatch && keywordMatch.index >= 0) {
    const fromKeyword = original.slice(keywordMatch.index);
    const pipeIndex = fromKeyword.indexOf("|");
    const newlineIndex = fromKeyword.search(/[\r\n]/);

    let endIndex = Math.min(fromKeyword.length, 200);
    if (pipeIndex >= 0) endIndex = Math.min(endIndex, pipeIndex);
    if (newlineIndex >= 0) endIndex = Math.min(endIndex, newlineIndex);

    return {
      text: fromKeyword.slice(0, endIndex),
      hasTotalKeyword: true,
    };
  }

  const upper = original.toUpperCase();
  if (
    upper.includes("INVESTMENT") &&
    upper.includes("PROGRAM") &&
    upper.includes("GRAND TOTAL")
  ) {
    const investmentIndex = upper.indexOf("INVESTMENT");
    if (investmentIndex >= 0) {
      const fromInvestment = original.slice(investmentIndex);
      const newlineIndex = fromInvestment.search(/[\r\n]/);
      let endIndex = Math.min(fromInvestment.length, 200);
      if (newlineIndex >= 0) endIndex = Math.min(endIndex, newlineIndex);

      return {
        text: fromInvestment.slice(0, endIndex),
        hasTotalKeyword: false,
      };
    }
  }

  const grandMatch = GRAND_TOTAL_PATTERN.exec(original);
  if (grandMatch && grandMatch.index >= 0) {
    const fromGrandMatch = original.slice(grandMatch.index);
    const newlineIndex = fromGrandMatch.search(/[\r\n]/);
    let endIndex = Math.min(fromGrandMatch.length, 200);
    if (newlineIndex >= 0) endIndex = Math.min(endIndex, newlineIndex);
    return {
      text: fromGrandMatch.slice(0, endIndex),
      hasTotalKeyword: false,
    };
  }

  return null;
}

function extractLastMoneyToken(value: string): string | null {
  MONEY_PATTERN.lastIndex = 0;
  let lastMatch: string | null = null;
  let match: RegExpExecArray | null = MONEY_PATTERN.exec(value);
  while (match) {
    if (match[1]) {
      lastMatch = match[1];
    }
    match = MONEY_PATTERN.exec(value);
  }
  MONEY_PATTERN.lastIndex = 0;
  return lastMatch;
}

export function formatTotalsEvidence(evidenceText: string): string {
  const original = evidenceText.trim();
  if (!original) return "";

  const candidate = extractCandidate(original);
  if (!candidate) {
    return trimToMax(normalizeWhitespace(stripFooterSegments(original)), 180);
  }

  const lastMoneyToken = extractLastMoneyToken(candidate.text);
  if (lastMoneyToken) {
    let cleanEvidence = candidate.hasTotalKeyword
      ? `TOTAL INVESTMENT PROGRAM ${lastMoneyToken}`
      : `INVESTMENT PROGRAM Grand Total ${lastMoneyToken}`;
    cleanEvidence = normalizeWhitespace(stripFooterSegments(cleanEvidence));
    if (cleanEvidence) {
      return cleanEvidence;
    }
  }

  const normalized = normalizeWhitespace(stripFooterSegments(candidate.text));
  if (normalized) {
    return normalized;
  }

  return trimToMax(normalizeWhitespace(stripFooterSegments(original)), 180);
}
