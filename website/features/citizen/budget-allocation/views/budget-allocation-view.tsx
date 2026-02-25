'use client';

import { useMemo, useState } from 'react';
import { DBV2_SECTOR_CODES, getSectorLabel, type DashboardSectorCode } from "@/lib/constants/dashboard";
import type { BudgetCategoryKey, AipDetailsRowVM } from "@/lib/domain/citizen-budget-allocation";
import CitizenExplainerCard from "@/features/citizen/components/citizen-explainer-card";
import CitizenPageHero from "@/features/citizen/components/citizen-page-hero";
import {
  AipDetailsSection,
  ChartsGrid,
  FiltersSection,
  OverviewHeader,
} from '../components';
import { CITIZEN_BUDGET_ALLOCATION_MOCK } from '@/mocks/fixtures/budget-allocation';
import { getRawBudgetAllocationData } from '../data';
import { normalizeSearchText } from '../utils';

const DEFAULT_TAB: BudgetCategoryKey = 'general';
const CATEGORY_ORDER: BudgetCategoryKey[] = ['general', 'social', 'economic', 'other'];
const CATEGORY_TO_SECTOR_CODE: Record<BudgetCategoryKey, DashboardSectorCode> = {
  general: '1000',
  social: '3000',
  economic: '8000',
  other: '9000',
};
const CATEGORY_COLOR_BY_KEY: Record<BudgetCategoryKey, string> = {
  general: '#3B82F6',
  social: '#14B8A6',
  economic: '#22C55E',
  other: '#F59E0B',
};

const resolveCategoryKey = (label: string): BudgetCategoryKey | null => {
  const normalizedLabel = label.trim().toLowerCase();
  if (normalizedLabel.includes('general')) return 'general';
  if (normalizedLabel.includes('social')) return 'social';
  if (normalizedLabel.includes('economic')) return 'economic';
  if (normalizedLabel.includes('other')) return 'other';
  return null;
};

export default function CitizenBudgetAllocationView() {
  const vm = CITIZEN_BUDGET_ALLOCATION_MOCK;

  const [activeTab, setActiveTab] = useState<BudgetCategoryKey>(DEFAULT_TAB);
  const [detailsSearch, setDetailsSearch] = useState<string>('');

  const viewAllHref = '/aips';
  const selectedLgu = vm.filters.availableLGUs.find(
    (option) => option.scopeType === vm.filters.selectedScopeType && option.id === vm.filters.selectedScopeId
  );
  const selectedLguLabel = selectedLgu?.label ?? vm.filters.availableLGUs[0]?.label ?? 'Selected LGU';

  const donutSectors = useMemo(() => {
    const cardMap = new Map(vm.categoryOverview.cards.map((card) => [card.categoryKey, card]));
    return CATEGORY_ORDER.map((categoryKey) => {
      const categoryCard = cardMap.get(categoryKey);
      const sectorCode = CATEGORY_TO_SECTOR_CODE[categoryKey];
      return {
        key: categoryKey,
        label: categoryCard?.label ?? getSectorLabel(sectorCode),
        amount: categoryCard?.totalAmount ?? 0,
        color: CATEGORY_COLOR_BY_KEY[categoryKey],
      };
    });
  }, [vm.categoryOverview.cards]);

  const donutTotal = donutSectors.reduce((total, sector) => total + sector.amount, 0);

  const trendData = useMemo(() => {
    const selectedLguRows = getRawBudgetAllocationData().filter((row) => row.lguName === selectedLguLabel);
    const rowsByYear = new Map<number, Record<BudgetCategoryKey, number>>();

    selectedLguRows.forEach((row) => {
      const categoryKey = resolveCategoryKey(row.category);
      if (!categoryKey || !DBV2_SECTOR_CODES.includes(CATEGORY_TO_SECTOR_CODE[categoryKey])) return;

      const yearTotals = rowsByYear.get(row.year) ?? {
        general: 0,
        social: 0,
        economic: 0,
        other: 0,
      };
      yearTotals[categoryKey] += row.budget;
      rowsByYear.set(row.year, yearTotals);
    });

    return Array.from(rowsByYear.entries())
      .sort((first, second) => first[0] - second[0])
      .map(([year, totals]) => ({
        year,
        ...totals,
      }));
  }, [selectedLguLabel]);

  const trendSubtitle = trendData.length > 0
    ? `Shows budget trends from ${trendData[0]?.year}-${trendData[trendData.length - 1]?.year}`
    : 'No trend data available for the selected LGU.';

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
    <section className="pb-16">
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <CitizenPageHero
          title={vm.hero.title.toUpperCase()}
          subtitle={vm.hero.subtitle}
          imageSrc="/citizen-dashboard/city.png"
          className="!rounded-none !border-0"
        />
      </div>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <CitizenExplainerCard title="What is Budget Allocation?" body={vm.explainer.body} />
      </section>
      <FiltersSection
        filters={{
          ...vm.filters,
          selectedYear: vm.filters.selectedYear,
          selectedScopeType: vm.filters.selectedScopeType,
          selectedScopeId: vm.filters.selectedScopeId,
        }}
        onYearChange={() => {}}
        onLguChange={() => {}}
      />
      <OverviewHeader
        title={`${selectedLguLabel} Budget Allocation Breakdown`}
        subtitle={`Total budget and allocation by category for FY ${vm.filters.selectedYear}`}
      />
      <ChartsGrid
        fiscalYear={vm.filters.selectedYear}
        totalBudget={donutTotal}
        sectors={donutSectors}
        trendSubtitle={trendSubtitle}
        trendData={trendData}
      />
      <AipDetailsSection
        vm={detailsVm}
        onTabChange={setActiveTab}
        onSearchChange={setDetailsSearch}
        viewAllHref={viewAllHref}
      />
    </section>
  );
}
