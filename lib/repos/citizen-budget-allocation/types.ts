import type { AipRow, BarangayRow, CityRow, ProjectRow, SectorRow } from "@/lib/contracts/databasev2";

export type BudgetAllocationFilters = {
  scope_type: "city" | "barangay";
  scope_id: string;
  fiscal_year: number;
  search: string;
};

export type BudgetAllocationData = {
  resolvedFilters: BudgetAllocationFilters;
  activeCities: CityRow[];
  activeBarangays: BarangayRow[];
  sectors: SectorRow[];
  publishedAips: AipRow[];
  projects: ProjectRow[];
};

export type CitizenBudgetAllocationRepo = {
  getBudgetAllocation(filters: BudgetAllocationFilters): Promise<BudgetAllocationData>;
};
