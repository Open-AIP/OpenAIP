const UNKNOWN_DATE_TOKENS = new Set([
  "unknown",
  "unknown date",
  "invalid date",
  "n/a",
]);

const MONTH_LOOKUP: Record<string, string> = {
  january: "January",
  jan: "January",
  february: "February",
  feb: "February",
  march: "March",
  mar: "March",
  april: "April",
  apr: "April",
  may: "May",
  june: "June",
  jun: "June",
  july: "July",
  jul: "July",
  august: "August",
  aug: "August",
  september: "September",
  sep: "September",
  sept: "September",
  october: "October",
  oct: "October",
  november: "November",
  nov: "November",
  december: "December",
  dec: "December",
};

function normalizeDateToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\.$/, "");
}

function isUnknownDateToken(value: string): boolean {
  const normalized = normalizeDateToken(value);
  return !normalized || UNKNOWN_DATE_TOKENS.has(normalized);
}

export function toLongDisplayDate(value: string | null | undefined): string | null {
  if (!value || isUnknownDateToken(value)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function toMonthYear(
  month: string | null | undefined,
  year: number | null | undefined
): string | null {
  if (!month || year == null) return null;
  if (!Number.isFinite(year)) return null;
  if (isUnknownDateToken(month)) return null;

  const canonicalMonth = MONTH_LOOKUP[normalizeDateToken(month)];
  if (!canonicalMonth) return null;

  return `${canonicalMonth} ${Math.trunc(year)}`;
}

export function toDateRangeLabel(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string | null {
  const startLabel = toLongDisplayDate(startDate);
  const endLabel = toLongDisplayDate(endDate);

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  if (startLabel) return `Starts ${startLabel}`;
  if (endLabel) return `Ends ${endLabel}`;
  return null;
}
