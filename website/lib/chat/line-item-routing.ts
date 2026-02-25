const TOKEN_SPLIT_PATTERN = /[^a-z0-9]+/g;
const REF_CODE_PATTERN = /\b\d{4}[a-z0-9-]*\b/i;

export type LineItemFactField =
  | "amount"
  | "schedule"
  | "fund_source"
  | "implementing_agency"
  | "expected_output";

export type ParsedLineItemQuestion = {
  normalizedQuestion: string;
  factFields: LineItemFactField[];
  isFactQuestion: boolean;
  isUnanswerableFieldQuestion: boolean;
  mentionedRefCode: string | null;
  keyTokens: string[];
};

export type LineItemMatchCandidate = {
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

export type RankedLineItemCandidate = LineItemMatchCandidate & {
  rerank_score: number;
  token_overlap: number;
  ref_code_match: boolean;
  year_match: boolean;
};

export type LineItemRowRecord = {
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

const KEY_TOKEN_STOPWORDS = new Set([
  "what",
  "which",
  "where",
  "when",
  "how",
  "much",
  "allocated",
  "allocation",
  "for",
  "the",
  "and",
  "from",
  "in",
  "on",
  "of",
  "to",
  "is",
  "are",
  "fy",
  "year",
  "fiscal",
  "program",
  "project",
  "total",
  "schedule",
  "fund",
  "source",
  "agency",
  "implementing",
  "output",
]);

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeRefCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = input.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
  return normalized || null;
}

function normalizeTitle(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function collectKeyTokens(normalizedQuestion: string): string[] {
  const parts = normalizedQuestion
    .split(TOKEN_SPLIT_PATTERN)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !KEY_TOKEN_STOPWORDS.has(token));

  const unique: string[] = [];
  for (const token of parts) {
    if (!unique.includes(token)) {
      unique.push(token);
    }
  }
  return unique;
}

function detectFactFields(normalizedQuestion: string): LineItemFactField[] {
  const fields: LineItemFactField[] = [];

  const hasAmountCue =
    normalizedQuestion.includes("how much") ||
    normalizedQuestion.includes("amount") ||
    normalizedQuestion.includes("allocated") ||
    normalizedQuestion.includes("allocation") ||
    normalizedQuestion.includes("budget") ||
    normalizedQuestion.includes("cost");
  if (hasAmountCue) fields.push("amount");

  const hasScheduleCue =
    normalizedQuestion.includes("schedule") ||
    normalizedQuestion.includes("timeline") ||
    normalizedQuestion.includes("start") ||
    normalizedQuestion.includes("end date") ||
    normalizedQuestion.includes("target completion") ||
    normalizedQuestion.includes("when");
  if (hasScheduleCue) fields.push("schedule");

  const hasFundCue =
    normalizedQuestion.includes("fund source") ||
    normalizedQuestion.includes("funding source") ||
    normalizedQuestion.includes("source of funds") ||
    normalizedQuestion.includes("funded by");
  if (hasFundCue) fields.push("fund_source");

  const hasImplementingCue =
    normalizedQuestion.includes("implementing agency") ||
    normalizedQuestion.includes("implementing office") ||
    normalizedQuestion.includes("implemented by") ||
    normalizedQuestion.includes("who will implement");
  if (hasImplementingCue) fields.push("implementing_agency");

  const hasOutputCue =
    normalizedQuestion.includes("expected output") ||
    normalizedQuestion.includes("target output") ||
    normalizedQuestion.includes("deliverable") ||
    normalizedQuestion.includes("output");
  if (hasOutputCue) fields.push("expected_output");

  return fields;
}

function isUnanswerableFieldQuestion(normalizedQuestion: string): boolean {
  return (
    normalizedQuestion.includes("contractor") ||
    normalizedQuestion.includes("procurement mode") ||
    normalizedQuestion.includes("procurement") ||
    normalizedQuestion.includes("site address") ||
    normalizedQuestion.includes("exact address") ||
    normalizedQuestion.includes("beneficiary count") ||
    normalizedQuestion.includes("beneficiaries")
  );
}

export function parseLineItemQuestion(message: string): ParsedLineItemQuestion {
  const normalizedQuestion = normalizeText(message);
  const factFields = detectFactFields(normalizedQuestion);
  const refMatch = normalizedQuestion.match(REF_CODE_PATTERN);

  return {
    normalizedQuestion,
    factFields,
    isFactQuestion: factFields.length > 0,
    isUnanswerableFieldQuestion: isUnanswerableFieldQuestion(normalizedQuestion),
    mentionedRefCode: refMatch ? refMatch[0].toUpperCase() : null,
    keyTokens: collectKeyTokens(normalizedQuestion),
  };
}

export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export function rerankLineItemCandidates(input: {
  question: ParsedLineItemQuestion;
  candidates: LineItemMatchCandidate[];
  requestedFiscalYear: number | null;
}): RankedLineItemCandidate[] {
  const normalizedRef = normalizeRefCode(input.question.mentionedRefCode);

  const ranked = input.candidates.map((candidate) => {
    const title = normalizeTitle(candidate.program_project_title || "");
    const tokenOverlap = input.question.keyTokens.filter((token) => title.includes(token)).length;
    const refCodeMatch =
      normalizedRef !== null && normalizeRefCode(candidate.aip_ref_code) !== null
        ? normalizeRefCode(candidate.aip_ref_code) === normalizedRef
        : false;
    const yearMatch =
      input.requestedFiscalYear !== null && typeof candidate.fiscal_year === "number"
        ? candidate.fiscal_year === input.requestedFiscalYear
        : false;

    let rerankScore = typeof candidate.similarity === "number" ? candidate.similarity : -1;
    rerankScore += Math.min(0.12, tokenOverlap * 0.02);
    if (refCodeMatch) rerankScore += 0.25;
    if (yearMatch) rerankScore += 0.05;

    return {
      ...candidate,
      rerank_score: rerankScore,
      token_overlap: tokenOverlap,
      ref_code_match: refCodeMatch,
      year_match: yearMatch,
    };
  });

  ranked.sort((a, b) => {
    if (b.rerank_score !== a.rerank_score) return b.rerank_score - a.rerank_score;
    const aSim = typeof a.similarity === "number" ? a.similarity : -1;
    const bSim = typeof b.similarity === "number" ? b.similarity : -1;
    return bSim - aSim;
  });

  return ranked;
}

export function shouldAskLineItemClarification(candidates: RankedLineItemCandidate[]): boolean {
  if (candidates.length < 2) return false;
  if (candidates[0].ref_code_match) return false;

  const top = candidates[0];
  const second = candidates[1];
  const scoreGap = top.rerank_score - second.rerank_score;
  const topTitle = normalizeTitle(top.program_project_title);
  const secondTitle = normalizeTitle(second.program_project_title);

  return scoreGap < 0.03 && topTitle !== secondTitle;
}

export function formatPhpAmount(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }
  return `PHP ${new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatSchedule(startDate: string | null, endDate: string | null): string {
  const start = (startDate || "").trim();
  const end = (endDate || "").trim();
  if (start && end) return `${start} to ${end}`;
  if (start) return `${start} to N/A`;
  if (end) return `N/A to ${end}`;
  return "N/A";
}

export function buildLineItemAnswer(input: {
  row: LineItemRowRecord;
  fields: LineItemFactField[];
}): string {
  const row = input.row;
  const title = row.program_project_title.trim() || "the selected line item";

  const clauses: string[] = [];
  for (const field of input.fields) {
    if (field === "amount") {
      clauses.push(`total allocation: ${formatPhpAmount(row.total)}`);
    } else if (field === "schedule") {
      clauses.push(`schedule: ${formatSchedule(row.start_date, row.end_date)}`);
    } else if (field === "fund_source") {
      clauses.push(`fund source: ${(row.fund_source || "N/A").trim() || "N/A"}`);
    } else if (field === "implementing_agency") {
      clauses.push(`implementing agency: ${(row.implementing_agency || "N/A").trim() || "N/A"}`);
    } else if (field === "expected_output") {
      clauses.push(`expected output: ${(row.expected_output || "N/A").trim() || "N/A"}`);
    }
  }

  if (!clauses.length) {
    return `I found ${title}, but I need a specific field (amount, schedule, fund source, implementing agency, or expected output).`;
  }

  const refCode = (row.aip_ref_code || "").trim();
  const refText = refCode ? ` (Ref ${refCode})` : "";
  return `For ${title}${refText}, ${clauses.join("; ")}.`;
}

export function buildLineItemCitationSnippet(row: LineItemRowRecord): string {
  const title = row.program_project_title.trim() || "Untitled line item";
  const fund = (row.fund_source || "N/A").trim() || "N/A";
  const schedule = formatSchedule(row.start_date, row.end_date).replace(" to ", "..");
  const total = formatPhpAmount(row.total);
  return `${title} - Fund: ${fund} - Schedule: ${schedule} - Total: ${total}`;
}

export function buildClarificationOptions(candidates: RankedLineItemCandidate[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const candidate of candidates) {
    const title = (candidate.program_project_title || "").trim();
    if (!title) continue;
    const ref = (candidate.aip_ref_code || "").trim();
    const label = ref ? `${title} (Ref ${ref})` : title;
    if (seen.has(label)) continue;
    seen.add(label);
    options.push(label);
    if (options.length >= 3) break;
  }
  return options;
}
