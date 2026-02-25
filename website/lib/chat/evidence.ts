const TOTAL_KEYWORD_PATTERN = /total\s+investment\s+program/i;
const FOOTER_PATTERN = /\b(?:Prepared by|Approved by|Reviewed by|Noted by)\b/i;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function trimToMax(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).trim();
}

export function formatTotalsEvidence(evidenceText: string): string {
  const original = evidenceText.trim();
  if (!original) return "";

  const keywordMatch = TOTAL_KEYWORD_PATTERN.exec(original);
  if (!keywordMatch || keywordMatch.index < 0) {
    return trimToMax(normalizeWhitespace(original), 180);
  }

  const fromKeyword = original.slice(keywordMatch.index);
  const pipeIndex = fromKeyword.indexOf("|");
  const newlineIndex = fromKeyword.search(/[\r\n]/);

  let endIndex = Math.min(fromKeyword.length, 120);
  if (pipeIndex >= 0) {
    endIndex = Math.min(endIndex, pipeIndex);
  }
  if (newlineIndex >= 0) {
    endIndex = Math.min(endIndex, newlineIndex);
  }

  let candidate = fromKeyword.slice(0, endIndex);
  const footerMatch = FOOTER_PATTERN.exec(candidate);
  if (footerMatch && typeof footerMatch.index === "number") {
    candidate = candidate.slice(0, footerMatch.index);
  }

  const normalized = normalizeWhitespace(candidate);
  if (normalized) {
    return normalized;
  }

  return trimToMax(normalizeWhitespace(original), 180);
}
