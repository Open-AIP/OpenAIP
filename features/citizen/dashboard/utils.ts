import type { CitizenDashboardCategoryAllocationVM, CitizenDashboardTransparencyStepVM } from "@/lib/types/viewmodels/dashboard";
import type { CitizenDashboardFilters, CitizenScopeType } from "@/lib/repos/citizen-dashboard";

const CATEGORY_LAYOUT = ["General Services", "Social Services", "Economic Services", "Other Services"] as const;

export function parseScopeType(value: string | null): CitizenScopeType {
  return value === "barangay" ? "barangay" : "city";
}

export function parseFiscalYear(value: string | null): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;
  return new Date().getFullYear();
}

export function readFiltersFromUrl(searchParams: URLSearchParams): CitizenDashboardFilters {
  return {
    scope_type: parseScopeType(searchParams.get("scope_type")),
    scope_id: searchParams.get("scope_id") ?? "",
    fiscal_year: parseFiscalYear(searchParams.get("fiscal_year")),
    search: searchParams.get("q") ?? "",
  };
}

export function filtersToParams(filters: CitizenDashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("scope_type", filters.scope_type);
  if (filters.scope_id) params.set("scope_id", filters.scope_id);
  params.set("fiscal_year", String(filters.fiscal_year));
  if (filters.search.trim()) params.set("q", filters.search.trim());
  return params;
}

export function filtersEqual(a: CitizenDashboardFilters, b: CitizenDashboardFilters): boolean {
  return (
    a.scope_type === b.scope_type &&
    a.scope_id === b.scope_id &&
    a.fiscal_year === b.fiscal_year &&
    a.search.trim() === b.search.trim()
  );
}

export function categoryCardClasses(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("general")) return "border-[#c6d9ee] bg-[#e8f1fb] text-[#0b5087]";
  if (normalized.includes("social")) return "border-[#bfe5cc] bg-[#e6f6ec] text-[#1f9f56]";
  if (normalized.includes("economic")) return "border-[#efe2a6] bg-[#fdf7df] text-[#d39d02]";
  return "border-[#d8dde5] bg-[#f3f5f8] text-[#6b7280]";
}

export function categoryChartColor(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("general")) return "#0f5d8e";
  if (normalized.includes("social")) return "#22c55e";
  if (normalized.includes("economic")) return "#eab308";
  return "#6b7280";
}

export function getScopeTypeLabel(scopeType: CitizenScopeType): "City" | "Barangay" {
  return scopeType === "city" ? "City" : "Barangay";
}

export function getStepTone(step: CitizenDashboardTransparencyStepVM): string {
  if (step.stepKey === "published") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (step.state === "complete") return "border-[#b9d2e6] bg-[#edf5fd] text-[#0f5d8e]";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

export function formatDaysSince(dateValue: string | null): string {
  if (!dateValue) return "N/A";
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return "N/A";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  return `${days} days`;
}

export function getOrderedCategoryRows(categories: CitizenDashboardCategoryAllocationVM[]) {
  return CATEGORY_LAYOUT.map((label) => {
    const found = categories.find((item) => item.sectorLabel.toLowerCase() === label.toLowerCase());
    return {
      label,
      amount: found?.amount ?? 0,
      percent: found?.percent ?? 0,
      sectorCode: found?.sectorCode ?? "",
    };
  });
}
