import type { ScopeResolutionResult } from "./types";

export type ParsedScopeCue = {
  hasOwnBarangayCue: boolean;
  requestedScopes: ScopeResolutionResult["requestedScopes"];
};

type ScopeType = "barangay" | "city" | "municipality";

const OWN_BARANGAY_PATTERNS: RegExp[] = [
  /\bin\s+our\s+barangay\b/i,
  /\bwithin\s+our\s+barangay\b/i,
  /\bsa\s+aming\s+barangay\b/i,
  /\bdito\s+sa\s+aming\s+barangay\b/i,
];

const PLACE_NAME_CAPTURE =
  "([a-z0-9][a-z0-9 .,'-]{1,80}?)" +
  "(?=\\s+(?:and|at|vs|versus|kumpara)\\s+(?:sa\\s+)?(?:barangay|city|municipality|lungsod|bayan)\\b|[.,;!?]|$)";

const SCOPE_PATTERNS: Array<{ scopeType: ScopeType; pattern: RegExp }> = [
  {
    scopeType: "barangay",
    pattern: new RegExp(`\\b(?:in|sa)\\s+barangay\\s+${PLACE_NAME_CAPTURE}`, "gi"),
  },
  { scopeType: "barangay", pattern: new RegExp(`\\bbarangay\\s+${PLACE_NAME_CAPTURE}`, "gi") },
  { scopeType: "city", pattern: new RegExp(`\\b(?:in|sa)\\s+city\\s+${PLACE_NAME_CAPTURE}`, "gi") },
  { scopeType: "city", pattern: new RegExp(`\\b(?:sa\\s+lungsod\\s+ng)\\s+${PLACE_NAME_CAPTURE}`, "gi") },
  { scopeType: "city", pattern: new RegExp(`\\bcity\\s+${PLACE_NAME_CAPTURE}`, "gi") },
  {
    scopeType: "municipality",
    pattern: new RegExp(`\\b(?:in|sa)\\s+municipality\\s+${PLACE_NAME_CAPTURE}`, "gi"),
  },
  {
    scopeType: "municipality",
    pattern: new RegExp(`\\b(?:sa\\s+bayan\\s+ng)\\s+${PLACE_NAME_CAPTURE}`, "gi"),
  },
  {
    scopeType: "municipality",
    pattern: new RegExp(`\\bmunicipality\\s+${PLACE_NAME_CAPTURE}`, "gi"),
  },
];

const PLACE_NOISE_WORDS = new Set([
  "our",
  "aming",
  "namin",
  "the",
  "this",
  "that",
  "barangay",
  "city",
  "municipality",
]);

function normalizeName(raw: string): string | null {
  const headOnly = raw.split(/[.,;!?]/)[0] ?? raw;
  const splitByConnector = headOnly
    .split(/\b(?:and|at|vs|versus|kumpara)\b/i)[0]
    ?.trim();
  const withoutTrailingClause = (splitByConnector ?? headOnly)
    .split(/\b(?:where|who|which|that|na|kung|for|with|about|regarding)\b/i)[0]
    ?.trim();

  const candidate = withoutTrailingClause;
  if (!candidate) return null;

  const cleaned = candidate
    .replace(/\s+/g, " ")
    .replace(/^[\s'"-]+|[\s'"-]+$/g, "")
    .trim();

  if (!cleaned) return null;

  const lowered = cleaned.toLowerCase();
  const firstToken = lowered.split(/\s+/)[0] ?? lowered;
  if (PLACE_NOISE_WORDS.has(firstToken)) return null;
  if (PLACE_NOISE_WORDS.has(lowered)) return null;
  if (lowered.startsWith("this ") || lowered.startsWith("our ")) return null;
  return cleaned;
}

function collectMatches(
  text: string,
  scopeType: ScopeType,
  pattern: RegExp,
  seen: Set<string>,
  out: ParsedScopeCue["requestedScopes"]
) {
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    const rawName = match[1] ?? "";
    const normalizedName = normalizeName(rawName);
    if (normalizedName) {
      const dedupe = `${scopeType}:${normalizedName.toLowerCase()}`;
      if (!seen.has(dedupe)) {
        seen.add(dedupe);
        out.push({ scopeType, scopeName: normalizedName });
      }
    }
    match = pattern.exec(text);
  }
}

export function parseScopeCue(question: string): ParsedScopeCue {
  const text = question.trim();
  const requestedScopes: ParsedScopeCue["requestedScopes"] = [];
  const seen = new Set<string>();

  for (const { scopeType, pattern } of SCOPE_PATTERNS) {
    collectMatches(text, scopeType, pattern, seen, requestedScopes);
  }

  const hasOwnBarangayCue = OWN_BARANGAY_PATTERNS.some((pattern) => pattern.test(text));

  return {
    hasOwnBarangayCue,
    requestedScopes,
  };
}
