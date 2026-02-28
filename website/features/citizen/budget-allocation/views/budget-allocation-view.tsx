'use client';

import { useEffect, useMemo, useState } from 'react';
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_TAB: BudgetCategoryKey = 'general';
const PAGE_SIZE = 10;
const CATEGORY_ORDER: BudgetCategoryKey[] = ['general', 'social', 'economic', 'other'];
const CATEGORY_TO_SECTOR_CODE: Record<BudgetCategoryKey, DashboardSectorCode> = {
  general: '1000',
  social: '3000',
  economic: '8000',
  other: '9000',
};
const SECTOR_CODE_TO_CATEGORY: Record<DashboardSectorCode, BudgetCategoryKey> = {
  "1000": "general",
  "3000": "social",
  "8000": "economic",
  "9000": "other",
};
const CATEGORY_COLOR_BY_KEY: Record<BudgetCategoryKey, string> = {
  general: '#3B82F6',
  social: '#14B8A6',
  economic: '#22C55E',
  other: '#F59E0B',
};

type SummaryPayload = {
  scope?: { scope_name?: string | null };
  totals?: {
    by_sector?: Array<{
      sector_code: DashboardSectorCode;
      sector_label: string;
      total: number;
    }>;
  };
  trend?: {
    years?: number[];
    series?: Array<{
      sector_code: DashboardSectorCode;
      values: number[];
    }>;
  };
};

type ProjectsPayload = {
  items: Array<{
    aip_ref_code: string;
    program_project_description: string;
    total: number;
  }>;
  totalPages: number;
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
  const [selectedYear, setSelectedYear] = useState<number>(vm.filters.selectedYear);
  const [selectedScopeType, setSelectedScopeType] = useState<"city" | "barangay">(vm.filters.selectedScopeType);
  const [selectedScopeId, setSelectedScopeId] = useState<string>(vm.filters.selectedScopeId);
  const [projectPage, setProjectPage] = useState<number>(1);

  const [summaryPayload, setSummaryPayload] = useState<SummaryPayload | null>(null);
  const [projectItems, setProjectItems] = useState<AipDetailsRowVM[]>([]);
  const [projectTotalPages, setProjectTotalPages] = useState<number>(1);

  const canFetchLiveData = UUID_PATTERN.test(selectedScopeId);
  const viewAllHref = '/aips';
  const selectedLgu = vm.filters.availableLGUs.find(
    (option) => option.scopeType === selectedScopeType && option.id === selectedScopeId
  );
  const selectedLguLabel = selectedLgu?.label ?? vm.filters.availableLGUs[0]?.label ?? 'Selected LGU';

  useEffect(() => {
    if (!canFetchLiveData) return;
    let cancelled = false;

    const loadSummary = async () => {
      const params = new URLSearchParams({
        fiscal_year: String(selectedYear),
        scope_type: selectedScopeType,
        scope_id: selectedScopeId,
      });

      const response = await fetch(`/api/citizen/budget-allocation/summary?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as SummaryPayload;
      if (!cancelled) {
        setSummaryPayload(response.ok ? payload : null);
      }
    };

    loadSummary().catch(() => {
      if (!cancelled) setSummaryPayload(null);
    });

    return () => {
      cancelled = true;
    };
  }, [canFetchLiveData, selectedYear, selectedScopeType, selectedScopeId]);

  useEffect(() => {
    if (!canFetchLiveData) return;
    let cancelled = false;

    const loadProjects = async () => {
      const params = new URLSearchParams({
        fiscal_year: String(selectedYear),
        scope_type: selectedScopeType,
        scope_id: selectedScopeId,
        sector_code: CATEGORY_TO_SECTOR_CODE[activeTab],
        page: String(projectPage),
        pageSize: String(PAGE_SIZE),
      });

      if (detailsSearch.trim()) {
        params.set('q', detailsSearch.trim());
      }

      const response = await fetch(`/api/citizen/budget-allocation/projects?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as ProjectsPayload;
      if (!cancelled) {
        if (!response.ok) {
          setProjectItems([]);
          setProjectTotalPages(1);
          return;
        }

        setProjectItems(
          (payload.items ?? []).map((item) => ({
            categoryKey: activeTab,
            aipRefCode: item.aip_ref_code,
            programDescription: item.program_project_description,
            totalAmount: typeof item.total === 'number' ? item.total : 0,
          }))
        );
        setProjectTotalPages(Math.max(1, Number(payload.totalPages ?? 1)));
      }
    };

    loadProjects().catch(() => {
      if (!cancelled) {
        setProjectItems([]);
        setProjectTotalPages(1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canFetchLiveData, selectedYear, selectedScopeType, selectedScopeId, activeTab, projectPage, detailsSearch]);

  const localRows = useMemo(() => {
    const filteredRows = vm.aipDetails.rows.filter((row: AipDetailsRowVM) => row.categoryKey === activeTab);
    const detailQuery = normalizeSearchText(detailsSearch).toLowerCase();
    const searched = detailQuery
      ? filteredRows.filter(
          (row: AipDetailsRowVM) =>
            row.programDescription.toLowerCase().includes(detailQuery) ||
            row.aipRefCode.toLowerCase().includes(detailQuery)
        )
      : filteredRows;

    const from = (projectPage - 1) * PAGE_SIZE;
    return searched.slice(from, from + PAGE_SIZE);
  }, [activeTab, detailsSearch, projectPage, vm.aipDetails.rows]);

  const localTotalPages = useMemo(() => {
    const filteredRows = vm.aipDetails.rows.filter((row: AipDetailsRowVM) => row.categoryKey === activeTab);
    const detailQuery = normalizeSearchText(detailsSearch).toLowerCase();
    const searched = detailQuery
      ? filteredRows.filter(
          (row: AipDetailsRowVM) =>
            row.programDescription.toLowerCase().includes(detailQuery) ||
            row.aipRefCode.toLowerCase().includes(detailQuery)
        )
      : filteredRows;

    return Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  }, [activeTab, detailsSearch, vm.aipDetails.rows]);

  const donutSectors = useMemo(() => {
    if (!canFetchLiveData) {
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
    }

    const bySector = summaryPayload?.totals?.by_sector ?? [];
    const sectorMap = new Map(bySector.map((sector) => [sector.sector_code, sector]));
    return CATEGORY_ORDER.map((categoryKey) => {
      const sectorCode = CATEGORY_TO_SECTOR_CODE[categoryKey];
      const sector = sectorMap.get(sectorCode);
      return {
        key: categoryKey,
        label: sector?.sector_label ?? getSectorLabel(sectorCode),
        amount: typeof sector?.total === 'number' ? sector.total : 0,
        color: CATEGORY_COLOR_BY_KEY[categoryKey],
      };
    });
  }, [canFetchLiveData, summaryPayload, vm.categoryOverview.cards]);

  const donutTotal = donutSectors.reduce((total, sector) => total + sector.amount, 0);

  const trendData = useMemo(() => {
    if (!canFetchLiveData) {
      const selectedLguRows = getRawBudgetAllocationData().filter((row) => row.lguName === selectedLguLabel);
      const rowsByYear = new Map<number, Record<BudgetCategoryKey, number>>();
      selectedLguRows.forEach((row) => {
        const categoryKey = resolveCategoryKey(row.category);
        if (!categoryKey) return;
        const yearTotals = rowsByYear.get(row.year) ?? { general: 0, social: 0, economic: 0, other: 0 };
        yearTotals[categoryKey] += row.budget;
        rowsByYear.set(row.year, yearTotals);
      });

      return Array.from(rowsByYear.entries())
        .sort((first, second) => first[0] - second[0])
        .map(([year, totals]) => ({ year, ...totals }));
    }

    const years = Array.isArray(summaryPayload?.trend?.years) ? summaryPayload.trend.years : [];
    const series = Array.isArray(summaryPayload?.trend?.series) ? summaryPayload.trend.series : [];
    const seriesMap = new Map(series.map((item) => [item.sector_code, item.values]));

    return years.map((year, yearIndex) => {
      const point: Record<string, number> = { year };
      DBV2_SECTOR_CODES.forEach((code) => {
        const categoryKey = SECTOR_CODE_TO_CATEGORY[code];
        const values = seriesMap.get(code) ?? [];
        point[categoryKey] = typeof values[yearIndex] === 'number' ? values[yearIndex] : 0;
      });
      return point as { year: number; general: number; social: number; economic: number; other: number };
    });
  }, [canFetchLiveData, selectedLguLabel, summaryPayload]);

  const trendSubtitle = trendData.length > 0
    ? `Shows budget trends from ${trendData[0]?.year}-${trendData[trendData.length - 1]?.year}`
    : 'No trend data available for the selected LGU.';

  const detailsVm = {
    ...vm.aipDetails,
    activeTab,
    rows: canFetchLiveData ? projectItems : localRows,
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
          selectedYear,
          selectedScopeType,
          selectedScopeId,
        }}
        onYearChange={(year) => {
          setSelectedYear(year);
          setProjectPage(1);
        }}
        onLguChange={(scopeType, scopeId) => {
          setSelectedScopeType(scopeType);
          setSelectedScopeId(scopeId);
          setProjectPage(1);
        }}
      />
      <OverviewHeader
        title={`${summaryPayload?.scope?.scope_name ?? selectedLguLabel} Budget Allocation Breakdown`}
        subtitle={`Total budget and allocation by category for FY ${selectedYear}`}
      />
      <ChartsGrid
        fiscalYear={selectedYear}
        totalBudget={donutTotal}
        sectors={donutSectors}
        trendSubtitle={trendSubtitle}
        trendData={trendData}
      />
      <AipDetailsSection
        vm={detailsVm}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setProjectPage(1);
        }}
        onSearchChange={(value) => {
          setDetailsSearch(value);
          setProjectPage(1);
        }}
        viewAllHref={viewAllHref}
        page={projectPage}
        totalPages={canFetchLiveData ? projectTotalPages : localTotalPages}
        onPageChange={setProjectPage}
      />
    </section>
  );
}
