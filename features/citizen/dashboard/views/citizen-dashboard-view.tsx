"use client";

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
import { useCitizenDashboard } from "../hooks/use-citizen-dashboard";

export default function CitizenDashboardView() {
  const {
    draftFilters,
    setDraftFilters,
    viewModel,
    isLoading,
    error,
    applyFilters,
    aipParams,
    selectedScopeTypeLabel,
    categoryRows,
    latestPublishedAt,
    projectQueryString,
    highlightProjectsByType,
  } = useCitizenDashboard();

  if (isLoading && !viewModel) {
    return <DashboardLoadingState />;
  }

  if (error || !viewModel) {
    return <DashboardErrorState message={error ?? "Unable to load citizen dashboard."} />;
  }

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
