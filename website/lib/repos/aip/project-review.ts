import type {
  AipProjectEditPatch,
  AipProjectEditableFields,
  AipProjectRow,
  ProjectCategory,
  Sector,
} from "./types";

export const PROJECT_EDITABLE_FIELD_KEYS = [
  "aipRefCode",
  "programProjectDescription",
  "implementingAgency",
  "startDate",
  "completionDate",
  "expectedOutput",
  "sourceOfFunds",
  "personalServices",
  "maintenanceAndOtherOperatingExpenses",
  "financialExpenses",
  "capitalOutlay",
  "total",
  "climateChangeAdaptation",
  "climateChangeMitigation",
  "ccTopologyCode",
  "category",
  "errors",
] as const satisfies ReadonlyArray<keyof AipProjectEditableFields>;

export type EditableFieldKey = (typeof PROJECT_EDITABLE_FIELD_KEYS)[number];

const NUMERIC_KEYS = new Set<EditableFieldKey>([
  "personalServices",
  "maintenanceAndOtherOperatingExpenses",
  "financialExpenses",
  "capitalOutlay",
  "total",
]);

const NULLABLE_TEXT_KEYS = new Set<EditableFieldKey>([
  "implementingAgency",
  "startDate",
  "completionDate",
  "expectedOutput",
  "sourceOfFunds",
  "climateChangeAdaptation",
  "climateChangeMitigation",
  "ccTopologyCode",
]);

export const PROJECT_FIELD_LABELS: Record<EditableFieldKey, string> = {
  aipRefCode: "AIP Reference Code",
  programProjectDescription: "Program/Project Description",
  implementingAgency: "Implementing Agency",
  startDate: "Start Date",
  completionDate: "Completion Date",
  expectedOutput: "Expected Output",
  sourceOfFunds: "Source of Funds",
  personalServices: "Personal Services",
  maintenanceAndOtherOperatingExpenses: "MOOE",
  financialExpenses: "Financial Expenses",
  capitalOutlay: "Capital Outlay",
  total: "Total",
  climateChangeAdaptation: "Climate Change Adaptation",
  climateChangeMitigation: "Climate Change Mitigation",
  ccTopologyCode: "CC Topology Code",
  category: "Category",
  errors: "AI Issues",
};

function parseNumberLike(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.replaceAll(",", "").replaceAll("\u20b1", "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

export function normalizeProjectCategory(value: unknown): ProjectCategory {
  if (value === "health" || value === "infrastructure" || value === "other") {
    return value;
  }
  const lowered = String(value ?? "")
    .trim()
    .toLowerCase();
  if (lowered === "health" || lowered === "healthcare") return "health";
  if (lowered === "infrastructure") return "infrastructure";
  return "other";
}

export function normalizeProjectErrors(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
    return cleaned.length ? cleaned : null;
  }
  const single = String(value).trim();
  return single ? [single] : null;
}

function normalizeRequiredText(value: unknown, fallback = ""): string {
  const trimmed = String(value ?? "").trim();
  if (trimmed) return trimmed;
  return fallback;
}

function normalizeEditableField(
  key: EditableFieldKey,
  value: unknown,
  fallback: unknown
): AipProjectEditableFields[EditableFieldKey] {
  if (key === "category") return normalizeProjectCategory(value);
  if (key === "errors") return normalizeProjectErrors(value);
  if (NUMERIC_KEYS.has(key)) return parseNumberLike(value);
  if (NULLABLE_TEXT_KEYS.has(key)) return normalizeNullableText(value);
  return normalizeRequiredText(value, String(fallback ?? ""));
}

export function projectEditableFieldsFromRow(
  row: Pick<AipProjectRow, keyof AipProjectEditableFields>
): AipProjectEditableFields {
  const normalized = {} as AipProjectEditableFields;
  const target = normalized as Record<
    EditableFieldKey,
    AipProjectEditableFields[EditableFieldKey]
  >;
  for (const key of PROJECT_EDITABLE_FIELD_KEYS) {
    target[key] = normalizeEditableField(key, row[key], row[key]);
  }
  return normalized;
}

export function normalizeProjectEditPatch(
  patch: AipProjectEditPatch | undefined,
  base: AipProjectEditableFields
): AipProjectEditPatch {
  if (!patch) return {};
  const normalized: AipProjectEditPatch = {};
  const target = normalized as Record<
    EditableFieldKey,
    AipProjectEditableFields[EditableFieldKey] | undefined
  >;
  for (const key of PROJECT_EDITABLE_FIELD_KEYS) {
    if (!(key in patch)) continue;
    target[key] = normalizeEditableField(key, patch[key], base[key]);
  }
  return normalized;
}

export function applyProjectEditPatch(
  base: AipProjectEditableFields,
  patch: AipProjectEditPatch | undefined
): AipProjectEditableFields {
  const normalizedPatch = normalizeProjectEditPatch(patch, base);
  return {
    ...base,
    ...normalizedPatch,
  };
}

function valuesEqual(
  key: EditableFieldKey,
  left: AipProjectEditableFields[EditableFieldKey],
  right: AipProjectEditableFields[EditableFieldKey]
): boolean {
  if (key === "errors") {
    const a = (left as string[] | null) ?? null;
    const b = (right as string[] | null) ?? null;
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  }
  return left === right;
}

export type AipProjectFieldDiff = {
  key: EditableFieldKey;
  label: string;
  before: AipProjectEditableFields[EditableFieldKey];
  after: AipProjectEditableFields[EditableFieldKey];
};

export function diffProjectEditableFields(
  before: AipProjectEditableFields,
  after: AipProjectEditableFields
): AipProjectFieldDiff[] {
  const diffs: AipProjectFieldDiff[] = [];
  for (const key of PROJECT_EDITABLE_FIELD_KEYS) {
    if (valuesEqual(key, before[key], after[key])) continue;
    diffs.push({
      key,
      label: PROJECT_FIELD_LABELS[key],
      before: before[key],
      after: after[key],
    });
  }
  return diffs;
}

export function deriveSectorFromRefCode(aipRefCode: string | null | undefined): Sector {
  const refCode = String(aipRefCode ?? "").trim();
  if (refCode.startsWith("1000")) return "General Sector";
  if (refCode.startsWith("3000")) return "Social Sector";
  if (refCode.startsWith("8000")) return "Economic Sector";
  if (refCode.startsWith("9000")) return "Other Services";
  return "Unknown";
}

export function formatDiffValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (!value.length) return "(none)";
    return value.join(" | ");
  }
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

export function formatProjectDiffLines(diff: AipProjectFieldDiff[]): string[] {
  return diff.map(
    (item) =>
      `- ${item.label}: ${formatDiffValue(item.before)} -> ${formatDiffValue(item.after)}`
  );
}

export function buildProjectReviewBody(input: {
  reason: string;
  diff: AipProjectFieldDiff[];
}): string {
  const reason = input.reason.trim();
  const lines = formatProjectDiffLines(input.diff);
  if (!lines.length) return reason;
  return `${reason}\n\nChanges:\n${lines.join("\n")}`;
}
