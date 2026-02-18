export type BudgetCategoryKey = "general" | "social" | "economic" | "other";

export type BudgetAllocationLguOptionVM = {
  id: string;
  label: string;
  scopeType: "city" | "barangay";
};

export type BudgetAllocationFiltersVM = {
  selectedYear: number;
  selectedScopeType: "city" | "barangay";
  selectedScopeId: string;
  selectedLguLabel: string;
  searchText: string;
  availableYears: number[];
  availableLGUs: BudgetAllocationLguOptionVM[];
};

export type CategoryCardVM = {
  categoryKey: BudgetCategoryKey;
  label: string;
  totalAmount: number;
  projectCount: number;
  deltaAbs?: number | null;
  deltaPct?: number | null;
  trend?: "up" | "down" | "flat" | "na";
};

export type AllocationChartVM = {
  labels: string[];
  values: number[];
  legend: { label: string; value: number; color: string }[];
};

export type SelectedContextVM = {
  scopeLabel: string;
  totalAllocation: number;
  totalProjects: number;
  yoyPct: number | null;
  yoyAbs: number | null;
  hasPriorYear: boolean;
};

export type AipDetailsRowVM = {
  aipRefCode: string;
  programDescription: string;
  totalAmount: number;
  categoryKey: BudgetCategoryKey;
};

export type AipDetailsTabVM = {
  key: BudgetCategoryKey;
  label: string;
  count: number;
  totalAmount: number;
};

export type AipDetailsTableVM = {
  title: string;
  subtitle: string;
  tabs: AipDetailsTabVM[];
  activeTab: BudgetCategoryKey;
  rows: AipDetailsRowVM[];
  searchText: string;
  totalsByTab: Record<BudgetCategoryKey, { totalAmount: number; projectCount: number }>;
};

export type YearChangeSummaryVM = {
  totalDeltaAbs: number | null;
  totalDeltaPct: number | null;
  currentFYTotal: number;
  priorFYTotal: number | null;
  hasPriorYear: boolean;
};

export type CategoryChangeVM = {
  categoryKey: BudgetCategoryKey;
  label: string;
  currentTotal: number;
  priorTotal: number | null;
  deltaAbs: number | null;
  deltaPct: number | null;
  trend: "up" | "down" | "flat" | "na";
  chartBars: { label: string; value: number }[];
};

export type ChangesFromLastYearVM = {
  summary: YearChangeSummaryVM;
  categories: CategoryChangeVM[];
};

export type CitizenBudgetAllocationVM = {
  hero: {
    title: string;
    subtitle: string;
  };
  explainer: {
    title: string;
    body: string;
  };
  filters: BudgetAllocationFiltersVM;
  categoryOverview: {
    scopeLabel: string;
    cards: CategoryCardVM[];
  };
  allocationContext: {
    chart: AllocationChartVM;
    selectedContext: SelectedContextVM;
  };
  aipDetails: AipDetailsTableVM;
  changesFromLastYear: ChangesFromLastYearVM;
};
