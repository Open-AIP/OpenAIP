"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { mapCitizenDashboardToVM } from "@/lib/mappers/dashboard/citizen";
import { getCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard";
import type { CitizenDashboardFilters } from "@/lib/repos/citizen-dashboard";
import type { CitizenDashboardHighlightProjectVM, CitizenDashboardVM } from "@/lib/types/viewmodels/dashboard";
import { CITIZEN_DASHBOARD_TOKENS } from "@/lib/ui/tokens";
import {
  AipStatusSection,
  BudgetBreakdownSection,
  DashboardErrorState,
  DashboardLoadingState,
  HeroSearchSection,
  LguStatusBoardSection,
  RecentlyPublishedAipsSection,
  TopFundedHighlightsSection,
  TopFundedProjectsSection,
  TransparencyJourneySection,
} from "../components";
import {
  filtersEqual,
  filtersToParams,
  getOrderedCategoryRows,
  getScopeTypeLabel,
  readFiltersFromUrl,
} from "../utils";

export default function CitizenDashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const repo = useMemo(() => getCitizenDashboardRepo(), []);
  const parsedFilters = useMemo(
    () => readFiltersFromUrl(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [draftFilters, setDraftFilters] = useState<CitizenDashboardFilters>(parsedFilters);
  const [viewModel, setViewModel] = useState<CitizenDashboardVM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftFilters(parsedFilters);
  }, [parsedFilters]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await repo.getDashboard(parsedFilters);
        const mapped = mapCitizenDashboardToVM(data);
        if (!active) return;

        setViewModel(mapped);

        const normalized: CitizenDashboardFilters = {
          scope_type: data.resolvedFilters.scope_type,
          scope_id: data.resolvedFilters.scope_id,
          fiscal_year: mapped.controls.selectedFiscalYear,
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
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [parsedFilters, pathname, repo, router]);

  const applyFilters = () => {
    const params = filtersToParams(draftFilters);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (isLoading && !viewModel) {
    return <DashboardLoadingState />;
  }

  if (error || !viewModel) {
    return <DashboardErrorState message={error ?? "Unable to load citizen dashboard."} />;
  }

  const aipParams = filtersToParams({
    scope_type: viewModel.controls.selectedScopeType,
    scope_id: viewModel.controls.selectedScopeId,
    fiscal_year: viewModel.controls.selectedFiscalYear,
    search: "",
  }).toString();

  const selectedScopeTypeLabel = getScopeTypeLabel(viewModel.controls.selectedScopeType);
  const categoryRows = getOrderedCategoryRows(viewModel.categoryAllocation);
  const latestPublishedAt = viewModel.aipStatusSummary.latestPublishedAt;

  const projectQueryString = new URLSearchParams({
    scope_type: viewModel.controls.selectedScopeType,
    scope_id: viewModel.controls.selectedScopeId,
    fiscal_year: String(viewModel.controls.selectedFiscalYear),
  }).toString();

  const highlightProjectsByType = (() => {
    const makeHighlight = (
      project: (typeof viewModel.topProjects)[number]
    ): CitizenDashboardHighlightProjectVM => ({
      projectId: project.projectId,
      title: project.title,
      projectType: project.projectType,
      sectorLabel: project.sectorLabel,
      budget: project.budget,
      scopeName: viewModel.hero.scopeLabel,
      fiscalYear: viewModel.controls.selectedFiscalYear,
      publishedAt: project.publishedAt,
      imageUrl: "/default/default-no-image.jpg",
      href: project.href,
    });

    const healthProject = viewModel.topProjects.find((project) => project.projectType === "health");
    const infrastructureProject = viewModel.topProjects.find(
      (project) => project.projectType === "infrastructure"
    );

    const selected: CitizenDashboardHighlightProjectVM[] = [];
    if (healthProject) selected.push(makeHighlight(healthProject));
    if (infrastructureProject) selected.push(makeHighlight(infrastructureProject));

    return selected.length > 0 ? selected : viewModel.highlightProjects;
  })();

  return (
    <section className="space-y-14 pb-12">
      <HeroSearchSection
        scopeLabel={viewModel.hero.scopeLabel}
        heroGradientClass={CITIZEN_DASHBOARD_TOKENS.heroGradientClass}
        heroAccentClass={CITIZEN_DASHBOARD_TOKENS.heroAccentTextClass}
        searchSurfaceClass={CITIZEN_DASHBOARD_TOKENS.searchPillSurfaceClass}
        primaryButtonClass={CITIZEN_DASHBOARD_TOKENS.primaryButtonClass}
        locationOptions={viewModel.controls.locationOptions}
        fiscalYearOptions={viewModel.controls.fiscalYearOptions}
        draftFilters={draftFilters}
        onScopeChange={(scopeType, scopeId) =>
          setDraftFilters((prev) => ({ ...prev, scope_type: scopeType, scope_id: scopeId }))
        }
        onFiscalYearChange={(year) =>
          setDraftFilters((prev) => ({ ...prev, fiscal_year: year }))
        }
        onSearchChange={(value) =>
          setDraftFilters((prev) => ({ ...prev, search: value }))
        }
        onSubmit={applyFilters}
      />

      <BudgetBreakdownSection
        scopeLabel={viewModel.hero.scopeLabel}
        fiscalYear={viewModel.budgetSummary.fiscalYear}
        totalBudget={viewModel.budgetSummary.totalBudget}
        categoryRows={categoryRows}
        categoryAllocation={viewModel.categoryAllocation}
        projectQueryString={projectQueryString}
      />

      <section className="space-y-6 px-2 md:px-6">
        <TopFundedHighlightsSection projects={highlightProjectsByType} />
        <TopFundedProjectsSection projects={viewModel.topProjects} />
      </section>

      <section className="space-y-8 px-2 md:px-6">
        <AipStatusSection
          scopeLabel={viewModel.hero.scopeLabel}
          scopeTypeLabel={selectedScopeTypeLabel}
          fiscalYear={viewModel.controls.selectedFiscalYear}
          latestPublishedAt={latestPublishedAt}
          aipParams={aipParams}
        />
        <TransparencyJourneySection steps={viewModel.transparencyJourney} />
      </section>

      <section className="space-y-8 px-2 md:px-6">
        <LguStatusBoardSection
          rows={viewModel.lguStatusBoard}
          fiscalYear={viewModel.controls.selectedFiscalYear}
        />
        <RecentlyPublishedAipsSection
          items={viewModel.recentlyPublishedAips}
          fiscalYear={viewModel.controls.selectedFiscalYear}
        />
      </section>
    </section>
  );
}
