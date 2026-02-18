import type { BudgetAllocationFilters } from "@/lib/repos/citizen-budget-allocation";
import type { BudgetCategoryKey } from "@/lib/types/viewmodels/citizen-budget-allocation.vm";

export function parseScopeType(value: string | null): BudgetAllocationFilters["scope_type"] {
  return value === "barangay" ? "barangay" : "city";
}

export function parseFiscalYear(value: string | null): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;
  return new Date().getFullYear();
}

export function readFiltersFromUrl(searchParams: URLSearchParams): BudgetAllocationFilters {
  return {
    scope_type: parseScopeType(searchParams.get("scope_type")),
    scope_id: searchParams.get("scope_id") ?? "",
    fiscal_year: parseFiscalYear(searchParams.get("fiscal_year")),
    search: searchParams.get("q") ?? "",
  };
}

export function filtersToParams(filters: BudgetAllocationFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("scope_type", filters.scope_type);
  if (filters.scope_id) params.set("scope_id", filters.scope_id);
  params.set("fiscal_year", String(filters.fiscal_year));
  if (filters.search.trim()) params.set("q", filters.search.trim());
  return params;
}

export function filtersEqual(a: BudgetAllocationFilters, b: BudgetAllocationFilters): boolean {
  return (
    a.scope_type === b.scope_type &&
    a.scope_id === b.scope_id &&
    a.fiscal_year === b.fiscal_year &&
    a.search.trim() === b.search.trim()
  );
}

export function formatCompactPeso(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
}

export function categoryAccentClass(key: BudgetCategoryKey): string {
  if (key === "general") return "border-[#BEDBFF] bg-[#BEDBFF] text-[#0b4f87]";
  if (key === "social") return "border-[#B9F8CF] bg-[#B9F8CF] text-[#1f9f56]";
  if (key === "economic") return "border-[#FFF085] bg-[#FFF085] text-[#d39d02]";
  return "border-[#E5E7EB] bg-[#F9FAFB] text-slate-600";
}

export function categoryIconClass(key: BudgetCategoryKey): string {
  if (key === "general") return "text-[#1f63ff]";
  if (key === "social") return "text-[#16a34a]";
  if (key === "economic") return "text-[#d39d02]";
  return "text-slate-500";
}

export function trendBadgeClass(trend: "up" | "down" | "flat" | "na") {
  if (trend === "up") return "bg-emerald-100 text-emerald-700";
  if (trend === "down") return "bg-amber-100 text-amber-700";
  if (trend === "flat") return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-500";
}

export function normalizeSearchText(value: string): string {
  return value.trim();
}
