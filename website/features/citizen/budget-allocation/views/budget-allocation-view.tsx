'use client';

import { useState } from 'react';
import type { BudgetCategoryKey, CategoryCardVM, CategoryChangeVM, AipDetailsRowVM } from "@/lib/domain/citizen-budget-allocation";
import {
  AipDetailsSection,
  AllocationAndContextSection,
  CategoryOverviewSection,
  ChangesFromLastYearSection,
  ExplainerSection,
  FiltersSection,
  HeroBannerSection,
} from '../components';
import { CITIZEN_BUDGET_ALLOCATION_MOCK } from '@/mocks/fixtures/budget-allocation';
import { normalizeSearchText } from '../utils';

const DEFAULT_TAB: BudgetCategoryKey = 'general';
const DEFAULT_CONTEXT: 'all' | BudgetCategoryKey = 'all';

export default function CitizenBudgetAllocationView() {
  const vm = CITIZEN_BUDGET_ALLOCATION_MOCK;

  const [activeTab, setActiveTab] = useState<BudgetCategoryKey>(DEFAULT_TAB);
  const [detailsSearch, setDetailsSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | BudgetCategoryKey>(DEFAULT_CONTEXT);

  const categoryOptions = [
    { key: 'all' as const, label: 'All Categories' },
    ...vm.categoryOverview.cards.map((card: CategoryCardVM) => ({
      key: card.categoryKey,
      label: card.label,
    })),
  ];

  const selectedContext = (() => {
    if (selectedCategory === 'all') return vm.allocationContext.selectedContext;
    const card = vm.categoryOverview.cards.find((item: CategoryCardVM) => item.categoryKey === selectedCategory);
    const change = vm.changesFromLastYear.categories.find((item: CategoryChangeVM) => item.categoryKey === selectedCategory);
    if (!card) return vm.allocationContext.selectedContext;

    return {
      ...vm.allocationContext.selectedContext,
      totalAllocation: card.totalAmount,
      totalProjects: card.projectCount,
      yoyAbs: change?.deltaAbs ?? null,
      yoyPct: change?.deltaPct ?? null,
      hasPriorYear: change?.priorTotal !== null && change?.priorTotal !== undefined,
    };
  })();

  const viewAllHref = '/aips';

  const filteredRows = vm.aipDetails.rows.filter((row: AipDetailsRowVM) => row.categoryKey === activeTab);
  const detailQuery = normalizeSearchText(detailsSearch).toLowerCase();
  const detailRows = detailQuery
    ? filteredRows.filter(
        (row: AipDetailsRowVM) =>
          row.programDescription.toLowerCase().includes(detailQuery) ||
          row.aipRefCode.toLowerCase().includes(detailQuery)
      )
    : filteredRows;

  const detailsVm = {
    ...vm.aipDetails,
    activeTab,
    rows: detailRows,
    searchText: detailsSearch,
  };

  return (
    <section className="space-y-6 pb-10" style={{ background: 'linear-gradient(180deg, #d3dbe0, #ffffff 99.15%)' }}>
      <HeroBannerSection title={vm.hero.title.toUpperCase()} subtitle={vm.hero.subtitle} />
      <ExplainerSection title={vm.explainer.title} body={vm.explainer.body} />
      <FiltersSection
        filters={{
          ...vm.filters,
          searchText: vm.filters.searchText,
          selectedYear: vm.filters.selectedYear,
          selectedScopeType: vm.filters.selectedScopeType,
          selectedScopeId: vm.filters.selectedScopeId,
        }}
        onYearChange={() => {}}
        onLguChange={() => {}}
        onSearchChange={() => {}}
      />

      <CategoryOverviewSection scopeLabel={vm.categoryOverview.scopeLabel} cards={vm.categoryOverview.cards} />
      <AllocationAndContextSection
        chart={vm.allocationContext.chart}
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
      <ChangesFromLastYearSection vm={vm.changesFromLastYear} currentYear={vm.filters.selectedYear} />
    </section>
  );
}
