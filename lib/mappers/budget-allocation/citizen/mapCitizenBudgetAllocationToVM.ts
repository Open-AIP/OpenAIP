import type { AipRow, BarangayRow, ProjectRow } from "@/lib/contracts/databasev2";
import type { BudgetAllocationData } from "@/lib/repos/citizen-budget-allocation";
import type {
  AipDetailsRowVM,
  AipDetailsTableVM,
  BudgetAllocationFiltersVM,
  BudgetCategoryKey,
  CategoryCardVM,
  CategoryChangeVM,
  ChangesFromLastYearVM,
  CitizenBudgetAllocationVM,
  SelectedContextVM,
  YearChangeSummaryVM,
} from "@/lib/types/viewmodels/citizen-budget-allocation.vm";

const CATEGORY_META: Record<string, { key: BudgetCategoryKey; label: string; tabLabel: string; color: string }> = {
  "1000": { key: "general", label: "General Services", tabLabel: "General Sector", color: "#2563eb" },
  "3000": { key: "social", label: "Social Services", tabLabel: "Social Sector", color: "#22c55e" },
  "8000": { key: "economic", label: "Economic Services", tabLabel: "Economic Sector", color: "#eab308" },
  "9000": { key: "other", label: "Other Services", tabLabel: "Other Services", color: "#64748b" },
};

const CATEGORY_KEYS: BudgetCategoryKey[] = ["general", "social", "economic", "other"];

function coerceNumeric(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function getCategoryMetaBySector(code: string | null | undefined) {
  if (code && CATEGORY_META[code]) return CATEGORY_META[code];
  return { key: "other" as const, label: "Other Services", tabLabel: "Other Services", color: "#64748b" };
}

function buildScopeLabel(
  scopeType: "city" | "barangay",
  scopeId: string,
  citiesById: Map<string, string>,
  barangaysById: Map<string, string>
) {
  if (scopeType === "city") return citiesById.get(scopeId) ?? "Selected City";
  const barangayName = barangaysById.get(scopeId);
  return barangayName ? `Brgy. ${barangayName}` : "Selected Barangay";
}

function aipInScope(
  aip: AipRow,
  scopeType: "city" | "barangay",
  scopeId: string,
  barangayById: Map<string, BarangayRow>
): boolean {
  if (scopeType === "barangay") {
    return aip.barangay_id === scopeId;
  }

  if (aip.city_id === scopeId) {
    return true;
  }

  if (!aip.barangay_id) {
    return false;
  }

  return barangayById.get(aip.barangay_id)?.city_id === scopeId;
}

function filterProjectsByQuery(projects: ProjectRow[], query: string, sectorLabelByCode: Map<string, string>) {
  if (!query) return projects;
  const normalized = query.toLowerCase();
  return projects.filter((project) => {
    const sectorLabel = sectorLabelByCode.get(project.sector_code) ?? project.sector_code ?? "";
    return (
      project.program_project_description.toLowerCase().includes(normalized) ||
      project.aip_ref_code.toLowerCase().includes(normalized) ||
      sectorLabel.toLowerCase().includes(normalized)
    );
  });
}

function buildCategoryTotals(projects: ProjectRow[]) {
  const map = new Map<BudgetCategoryKey, { amount: number; count: number }>();
  CATEGORY_KEYS.forEach((key) => map.set(key, { amount: 0, count: 0 }));

  for (const project of projects) {
    const meta = getCategoryMetaBySector(project.sector_code);
    const current = map.get(meta.key) ?? { amount: 0, count: 0 };
    current.amount += coerceNumeric(project.total);
    current.count += 1;
    map.set(meta.key, current);
  }

  return map;
}

function buildDetailsRows(projects: ProjectRow[]): AipDetailsRowVM[] {
  return projects.map((project) => {
    const meta = getCategoryMetaBySector(project.sector_code);
    return {
      aipRefCode: project.aip_ref_code,
      programDescription: project.program_project_description,
      totalAmount: coerceNumeric(project.total),
      categoryKey: meta.key,
    };
  });
}

function buildTotalsByTab(rows: AipDetailsRowVM[]) {
  const totals: Record<BudgetCategoryKey, { totalAmount: number; projectCount: number }> = {
    general: { totalAmount: 0, projectCount: 0 },
    social: { totalAmount: 0, projectCount: 0 },
    economic: { totalAmount: 0, projectCount: 0 },
    other: { totalAmount: 0, projectCount: 0 },
  };

  for (const row of rows) {
    totals[row.categoryKey].totalAmount += row.totalAmount;
    totals[row.categoryKey].projectCount += 1;
  }

  return totals;
}

function buildTabs(totalsByTab: Record<BudgetCategoryKey, { totalAmount: number; projectCount: number }>) {
  return CATEGORY_KEYS.map((key) => {
    const label = Object.values(CATEGORY_META).find((item) => item.key === key)?.tabLabel ?? key;
    return {
      key,
      label,
      count: totalsByTab[key].projectCount,
      totalAmount: totalsByTab[key].totalAmount,
    };
  });
}

function buildChangeSummary(currentTotal: number, priorTotal: number | null): YearChangeSummaryVM {
  if (priorTotal === null) {
    return {
      totalDeltaAbs: null,
      totalDeltaPct: null,
      currentFYTotal: currentTotal,
      priorFYTotal: null,
      hasPriorYear: false,
    };
  }

  const deltaAbs = currentTotal - priorTotal;
  const deltaPct = priorTotal > 0 ? (deltaAbs / priorTotal) * 100 : null;

  return {
    totalDeltaAbs: deltaAbs,
    totalDeltaPct: deltaPct,
    currentFYTotal: currentTotal,
    priorFYTotal: priorTotal,
    hasPriorYear: true,
  };
}

function buildCategoryChanges(
  currentTotals: Map<BudgetCategoryKey, { amount: number; count: number }>,
  priorTotals: Map<BudgetCategoryKey, { amount: number; count: number }>,
  priorYear: number | null,
  currentYear: number
): CategoryChangeVM[] {
  return CATEGORY_KEYS.map((key) => {
    const current = currentTotals.get(key) ?? { amount: 0, count: 0 };
    const prior = priorTotals.get(key) ?? { amount: 0, count: 0 };
    const hasPrior = priorYear !== null;
    const deltaAbs = hasPrior ? current.amount - prior.amount : null;
    const deltaPct = hasPrior && prior.amount > 0 ? (deltaAbs ?? 0) / prior.amount * 100 : null;
    const trend = !hasPrior
      ? "na"
      : deltaAbs === 0
        ? "flat"
        : deltaAbs && deltaAbs > 0
          ? "up"
          : "down";

    const label = Object.values(CATEGORY_META).find((item) => item.key === key)?.label ?? key;

    return {
      categoryKey: key,
      label,
      currentTotal: current.amount,
      priorTotal: hasPrior ? prior.amount : null,
      deltaAbs,
      deltaPct,
      trend,
      chartBars: [
        { label: `FY ${priorYear ?? currentYear - 1}`, value: hasPrior ? prior.amount : 0 },
        { label: `FY ${currentYear}`, value: current.amount },
      ],
    };
  });
}

export function mapCitizenBudgetAllocationToVM(data: BudgetAllocationData): CitizenBudgetAllocationVM {
  const { resolvedFilters } = data;
  const citiesById = new Map(data.activeCities.map((city) => [city.id, city.name]));
  const barangaysById = new Map(data.activeBarangays.map((barangay) => [barangay.id, barangay.name]));
  const barangayRowById = new Map(data.activeBarangays.map((barangay) => [barangay.id, barangay]));
  const sectorLabelByCode = new Map(data.sectors.map((sector) => [sector.code, sector.label]));

  const scopeAips = data.publishedAips.filter((aip) =>
    aipInScope(aip, resolvedFilters.scope_type, resolvedFilters.scope_id, barangayRowById)
  );

  const fiscalYearOptions = Array.from(new Set(scopeAips.map((aip) => aip.fiscal_year))).sort((a, b) => b - a);
  const selectedFiscalYear = fiscalYearOptions.includes(resolvedFilters.fiscal_year)
    ? resolvedFilters.fiscal_year
    : fiscalYearOptions[0] ?? resolvedFilters.fiscal_year;

  const scopeLabel = buildScopeLabel(
    resolvedFilters.scope_type,
    resolvedFilters.scope_id,
    citiesById,
    barangaysById
  );

  const yearAips = scopeAips.filter((aip) => aip.fiscal_year === selectedFiscalYear);
  const yearAipIds = new Set(yearAips.map((aip) => aip.id));
  const yearProjects = data.projects.filter((project) => yearAipIds.has(project.aip_id));

  const query = resolvedFilters.search.trim();
  const matchingProjects = filterProjectsByQuery(yearProjects, query, sectorLabelByCode);

  const totalBudget = matchingProjects.reduce((sum, project) => sum + coerceNumeric(project.total), 0);
  const totalProjects = matchingProjects.length;

  const categoryTotals = buildCategoryTotals(matchingProjects);

  const categoryCards: CategoryCardVM[] = CATEGORY_KEYS.map((key) => {
    const meta = Object.values(CATEGORY_META).find((item) => item.key === key);
    const stats = categoryTotals.get(key) ?? { amount: 0, count: 0 };
    return {
      categoryKey: key,
      label: meta?.label ?? key,
      totalAmount: stats.amount,
      projectCount: stats.count,
    };
  });

  const chartLabels = CATEGORY_KEYS.map((key) => Object.values(CATEGORY_META).find((item) => item.key === key)?.label ?? key);
  const chartValues = CATEGORY_KEYS.map((key) => categoryTotals.get(key)?.amount ?? 0);
  const chartLegend = CATEGORY_KEYS.map((key) => {
    const meta = Object.values(CATEGORY_META).find((item) => item.key === key);
    return {
      label: meta?.label ?? key,
      value: categoryTotals.get(key)?.amount ?? 0,
      color: meta?.color ?? "#94a3b8",
    };
  });

  const currentYear = selectedFiscalYear;
  const priorYear = selectedFiscalYear - 1;
  const priorAips = scopeAips.filter((aip) => aip.fiscal_year === priorYear);
  const priorAipIds = new Set(priorAips.map((aip) => aip.id));
  const priorProjects = data.projects.filter((project) => priorAipIds.has(project.aip_id));
  const matchingPriorProjects = filterProjectsByQuery(priorProjects, query, sectorLabelByCode);

  const priorTotal = priorAips.length > 0
    ? matchingPriorProjects.reduce((sum, project) => sum + coerceNumeric(project.total), 0)
    : null;

  const selectedContext: SelectedContextVM = {
    scopeLabel,
    totalAllocation: totalBudget,
    totalProjects,
    yoyPct: priorTotal === null || priorTotal <= 0 ? null : ((totalBudget - priorTotal) / priorTotal) * 100,
    yoyAbs: priorTotal === null ? null : totalBudget - priorTotal,
    hasPriorYear: priorTotal !== null,
  };

  const detailsRows = buildDetailsRows(matchingProjects);
  const totalsByTab = buildTotalsByTab(detailsRows);
  const tabs = buildTabs(totalsByTab);

  const aipDetails: AipDetailsTableVM = {
    title: `${scopeLabel} - Annual Investment Plan (AIP) ${selectedFiscalYear} Details`,
    subtitle: "Total allocations across all four official service categories",
    tabs,
    activeTab: "general",
    rows: detailsRows,
    searchText: "",
    totalsByTab,
  };

  const currentTotals = categoryTotals;
  const priorTotals = buildCategoryTotals(matchingPriorProjects);

  const changesFromLastYear: ChangesFromLastYearVM = {
    summary: buildChangeSummary(totalBudget, priorTotal),
    categories: buildCategoryChanges(currentTotals, priorTotals, priorAips.length > 0 ? priorYear : null, currentYear),
  };

  const publishedCityIds = new Set(data.publishedAips.map((aip) => aip.city_id).filter(Boolean));
  const publishedBarangayIds = new Set(data.publishedAips.map((aip) => aip.barangay_id).filter(Boolean));

  const filteredCities = data.activeCities.filter((city) => publishedCityIds.has(city.id));
  const filteredBarangays = data.activeBarangays.filter((barangay) => publishedBarangayIds.has(barangay.id));

  const fallbackCities = filteredCities.length > 0 ? filteredCities : data.activeCities;
  const fallbackBarangays = filteredBarangays.length > 0 ? filteredBarangays : data.activeBarangays;

  const availableLGUs: BudgetAllocationFiltersVM["availableLGUs"] = [
    ...fallbackCities.map((city) => ({ id: city.id, label: city.name, scopeType: "city" as const })),
    ...fallbackBarangays.map((barangay) => ({
      id: barangay.id,
      label: `Brgy. ${barangay.name}`,
      scopeType: "barangay" as const,
    })),
  ];

  return {
    hero: {
      title: "Budget Allocation",
      subtitle: "Explore approved budget allocations by service category and project for the selected LGU and fiscal year.",
    },
    explainer: {
      title: "What are Budget Allocation?",
      body:
        "Budget allocation shows how public funds are distributed across service categories for specific programs in the selected fiscal year. It helps citizens understand which sectors receive priority funding and how projects are assigned to programs and infrastructure.",
    },
    filters: {
      selectedYear: selectedFiscalYear,
      selectedScopeType: resolvedFilters.scope_type,
      selectedScopeId: resolvedFilters.scope_id,
      selectedLguLabel: scopeLabel,
      searchText: resolvedFilters.search,
      availableYears: fiscalYearOptions,
      availableLGUs,
    },
    categoryOverview: {
      scopeLabel,
      cards: categoryCards,
    },
    allocationContext: {
      chart: {
        labels: chartLabels,
        values: chartValues,
        legend: chartLegend,
      },
      selectedContext,
    },
    aipDetails,
    changesFromLastYear,
  };
}
