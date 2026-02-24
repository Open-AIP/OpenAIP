import type { ProjectCategory } from "@/lib/contracts/databasev2/enums";
import type { DashboardQueryState } from "@/features/dashboard/types/dashboard-types";

export function parseOptionalYear(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCategory(value: string | undefined): ProjectCategory | "all" {
  if (value === "health" || value === "infrastructure" || value === "other") return value;
  return "all";
}

export function parseDashboardQueryState(input: {
  q?: string;
  tableQ?: string;
  category?: string;
  sector?: string;
  kpi?: string;
}): DashboardQueryState {
  return {
    q: input.q?.trim() ?? "",
    tableQ: input.tableQ?.trim() ?? "",
    tableCategory: parseCategory(input.category),
    tableSector: input.sector?.trim() ? input.sector : "all",
    kpiMode: input.kpi === "operational" ? "operational" : "summary",
  };
}
