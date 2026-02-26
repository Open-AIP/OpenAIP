function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const candidate = new Date(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

function extractLeadingYmd(value: string): string | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function normalizeDateValue(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const leadingYmd = extractLeadingYmd(trimmed);
  if (leadingYmd) {
    return leadingYmd;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return formatLocalDate(parsed);
}

export function toDateInputValue(value: string | null | undefined): string | undefined {
  return normalizeDateValue(value);
}

export function normalizeDateForStorage(value: string, label: string): string {
  const normalized = normalizeDateValue(value);
  if (!normalized) {
    throw new Error(`${label} must be a valid date.`);
  }
  return normalized;
}

