type ScopeType = "city" | "barangay" | "municipality" | "none";

const DEFAULT_FISCAL_YEARS = [2026, 2025, 2024, 2023] as const;

const FISCAL_YEARS_BY_SCOPE: Record<ScopeType, readonly number[]> = {
  city: DEFAULT_FISCAL_YEARS,
  barangay: DEFAULT_FISCAL_YEARS,
  municipality: DEFAULT_FISCAL_YEARS,
  none: DEFAULT_FISCAL_YEARS,
};

export function getAvailableFiscalYears(scope?: ScopeType): number[] {
  const years = FISCAL_YEARS_BY_SCOPE[scope ?? "none"] ?? DEFAULT_FISCAL_YEARS;
  return [...years];
}
