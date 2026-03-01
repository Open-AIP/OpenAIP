import type { LandingScopeType } from "@/lib/domain/landing-content";

type BuildDashboardScopeHrefInput = {
  pathname: string;
  searchParams: URLSearchParams;
  scopeType?: LandingScopeType;
  scopeId?: string;
  fiscalYear?: number;
};

function normalizeYear(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 2000 && value <= 2100 ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : null;
  }

  return null;
}

export function buildDashboardScopeHref(input: BuildDashboardScopeHrefInput): string | null {
  const scopeType = input.scopeType;
  const scopeId = typeof input.scopeId === "string" ? input.scopeId.trim() : "";
  if (!scopeType || !scopeId) return null;

  const params = new URLSearchParams(input.searchParams.toString());
  const currentScopeType = params.get("scope_type");
  const currentScopeId = params.get("scope_id");

  const resolvedFiscalYear =
    normalizeYear(input.fiscalYear) ?? normalizeYear(params.get("fiscal_year"));

  if (
    currentScopeType === scopeType &&
    currentScopeId === scopeId &&
    (resolvedFiscalYear === null || params.get("fiscal_year") === String(resolvedFiscalYear))
  ) {
    return null;
  }

  params.set("scope_type", scopeType);
  params.set("scope_id", scopeId);
  if (resolvedFiscalYear !== null) {
    params.set("fiscal_year", String(resolvedFiscalYear));
  }

  const query = params.toString();
  return query ? `${input.pathname}?${query}` : input.pathname;
}
