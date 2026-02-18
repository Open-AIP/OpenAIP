"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getCitizenBudgetAllocationRepo } from "@/lib/repos/citizen-budget-allocation";
import type { BudgetAllocationFilters } from "@/lib/repos/citizen-budget-allocation";
import { mapCitizenBudgetAllocationToVM } from "@/lib/mappers/budget-allocation/citizen";
import type { BudgetCategoryKey, CitizenBudgetAllocationVM } from "@/lib/types/viewmodels/citizen-budget-allocation.vm";
import {
  AipDetailsSection,
  AllocationAndContextSection,
  BudgetAllocationErrorState,
  BudgetAllocationLoadingState,
  CategoryOverviewSection,
  ChangesFromLastYearSection,
  ExplainerSection,
  FiltersSection,
  HeroBannerSection,
} from "../components";
import {
  filtersEqual,
  filtersToParams,
  normalizeSearchText,
  readFiltersFromUrl,
} from "../utils";

const DEFAULT_TAB: BudgetCategoryKey = "general";
const DEFAULT_CONTEXT: "all" | BudgetCategoryKey = "all";

export default function CitizenBudgetAllocationView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const repo = useMemo(() => getCitizenBudgetAllocationRepo(), []);
  const parsedFilters = useMemo(
    () => readFiltersFromUrl(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [draftFilters, setDraftFilters] = useState<BudgetAllocationFilters>(parsedFilters);
  const [viewModel, setViewModel] = useState<CitizenBudgetAllocationVM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<BudgetCategoryKey>(DEFAULT_TAB);
  const [detailsSearch, setDetailsSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | BudgetCategoryKey>(DEFAULT_CONTEXT);

  useEffect(() => {
    if (!viewModel) return;
    const firstAvailable = viewModel.aipDetails.tabs.find((tab) => tab.count > 0)?.key ?? DEFAULT_TAB;
    setActiveTab(firstAvailable);
  }, [viewModel]);

  useEffect(() => {
    setDraftFilters(parsedFilters);
  }, [parsedFilters]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await repo.getBudgetAllocation(parsedFilters);
        const mapped = mapCitizenBudgetAllocationToVM(data);
        if (!active) return;

        setViewModel(mapped);

        const normalized: BudgetAllocationFilters = {
          scope_type: data.resolvedFilters.scope_type,
          scope_id: data.resolvedFilters.scope_id,
          fiscal_year: mapped.filters.selectedYear,
          search: data.resolvedFilters.search,
        };
        setDraftFilters(normalized);

        if (!filtersEqual(parsedFilters, normalized)) {
          const params = filtersToParams(normalized);
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load budget allocation.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPage();
    return () => {
      active = false;
    };
  }, [parsedFilters, pathname, repo, router]);

  const updateFilters = (next: BudgetAllocationFilters) => {
    setDraftFilters(next);
    const params = filtersToParams(next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (isLoading && !viewModel) {
    return <BudgetAllocationLoadingState />;
  }

  if (error || !viewModel) {
    return <BudgetAllocationErrorState message={error ?? "Unable to load budget allocation."} />;
  }

  const categoryOptions = [
    { key: "all" as const, label: "All Categories" },
    ...viewModel.categoryOverview.cards.map((card) => ({
      key: card.categoryKey,
      label: card.label,
    })),
  ];

  const selectedContext = (() => {
    if (selectedCategory === "all") return viewModel.allocationContext.selectedContext;
    const card = viewModel.categoryOverview.cards.find((item) => item.categoryKey === selectedCategory);
    const change = viewModel.changesFromLastYear.categories.find((item) => item.categoryKey === selectedCategory);
    if (!card) return viewModel.allocationContext.selectedContext;

    return {
      ...viewModel.allocationContext.selectedContext,
      totalAllocation: card.totalAmount,
      totalProjects: card.projectCount,
      yoyAbs: change?.deltaAbs ?? null,
      yoyPct: change?.deltaPct ?? null,
      hasPriorYear: change?.priorTotal !== null && change?.priorTotal !== undefined,
    };
  })();

  const aipParams = filtersToParams({
    scope_type: viewModel.filters.selectedScopeType,
    scope_id: viewModel.filters.selectedScopeId,
    fiscal_year: viewModel.filters.selectedYear,
    search: "",
  }).toString();
  const viewAllHref = aipParams ? `/aips?${aipParams}` : "/aips";

  const filteredRows = viewModel.aipDetails.rows.filter((row) => row.categoryKey === activeTab);
  const detailQuery = normalizeSearchText(detailsSearch).toLowerCase();
  const detailRows = detailQuery
    ? filteredRows.filter((row) =>
        row.programDescription.toLowerCase().includes(detailQuery) ||
        row.aipRefCode.toLowerCase().includes(detailQuery)
      )
    : filteredRows;

  const detailsVm = {
    ...viewModel.aipDetails,
    activeTab,
    rows: detailRows,
    searchText: detailsSearch,
  };

  return (
    <section className="space-y-6 pb-10">
      <HeroBannerSection title={viewModel.hero.title.toUpperCase()} subtitle={viewModel.hero.subtitle} />
      <ExplainerSection title={viewModel.explainer.title} body={viewModel.explainer.body} />
      <FiltersSection
        filters={{
          ...viewModel.filters,
          searchText: draftFilters.search,
          selectedYear: draftFilters.fiscal_year,
          selectedScopeType: draftFilters.scope_type,
          selectedScopeId: draftFilters.scope_id,
        }}
        onYearChange={(year) =>
          updateFilters({
            ...draftFilters,
            fiscal_year: year,
          })
        }
        onLguChange={(scopeType, scopeId) =>
          updateFilters({
            ...draftFilters,
            scope_type: scopeType,
            scope_id: scopeId,
          })
        }
        onSearchChange={(value) =>
          updateFilters({
            ...draftFilters,
            search: value,
          })
        }
      />

      <CategoryOverviewSection scopeLabel={viewModel.categoryOverview.scopeLabel} cards={viewModel.categoryOverview.cards} />
      <AllocationAndContextSection
        chart={viewModel.allocationContext.chart}
        selectedContext={selectedContext}
        categoryOptions={categoryOptions}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <AipDetailsSection
        vm={detailsVm}
        onTabChange={setActiveTab}
        onSearchChange={setDetailsSearch}
        viewAllHref={viewAllHref}
      />
      <ChangesFromLastYearSection
        vm={viewModel.changesFromLastYear}
        currentYear={viewModel.filters.selectedYear}
      />
    </section>
  );
}
