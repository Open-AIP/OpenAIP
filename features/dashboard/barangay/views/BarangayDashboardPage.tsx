"use client";

import { useMemo } from "react";
import BudgetBreakdownSection from "../components/BudgetBreakdownSection";
import CitizenEngagementPulseColumn from "../components/CitizenEngagementPulseColumn";
import CityAipStatusColumn from "../components/CityAipStatusColumn";
import DashboardHeader from "../components/DashboardHeader";
import KpiRow from "../components/KpiRow";
import RecentProjectUpdatesCard from "../components/RecentProjectUpdatesCard";
import TopFundedProjectsSection from "../components/TopFundedProjectsSection";
import { useBarangayDashboard } from "../hooks/useBarangayDashboard";

export default function BarangayDashboardPage() {
  const { isLoading, error, viewModel, setYear, setGlobalSearch, setTopProjectsFilters } = useBarangayDashboard();

  const handlers = useMemo(
    () => ({
      onViewAllProjects: () => {
        console.info("[TODO] /barangay/projects route is not available yet; wire once route exists.");
      },
      onUploadCityAip: () => {
        console.info("[TODO] Wire city AIP upload flow for barangay officials.");
      },
      onViewAudit: () => {
        console.info("[TODO] Wire audit CTA if custom navigation is required.");
      },
    }),
    []
  );

  if (isLoading && !viewModel) {
    return <div className="text-sm text-slate-500">Loading barangay dashboard...</div>;
  }

  if (error || !viewModel) {
    return <div className="text-sm text-rose-600">{error ?? "Unable to load dashboard."}</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader
        year={viewModel.header.year}
        yearOptions={viewModel.header.yearOptions}
        search={viewModel.header.search}
        onYearChange={(value) => setYear(Number(value))}
        onSearchChange={setGlobalSearch}
      />

      <KpiRow cards={viewModel.kpis} />

      <BudgetBreakdownSection
        breakdown={viewModel.budgetBreakdown}
        dateCard={viewModel.dateCard}
        workingOn={viewModel.workingOn}
        aipDetailsHref={viewModel.aipDetailsHref}
        onViewAllProjects={handlers.onViewAllProjects}
      />

      <div className="grid gap-6 xl:grid-cols-[7fr_3fr]">
        <TopFundedProjectsSection
          rows={viewModel.topFunded.rows}
          filters={viewModel.topFunded.filters}
          categoryOptions={viewModel.topFunded.categoryOptions}
          typeOptions={viewModel.topFunded.typeOptions}
          onFilterChange={setTopProjectsFilters}
        />
        <RecentProjectUpdatesCard items={viewModel.recentProjectUpdates} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CityAipStatusColumn
          cityAipCoverage={viewModel.cityAipCoverage}
          publicationTimeline={viewModel.publicationTimeline}
          cityAipsByYear={viewModel.cityAipsByYear}
          recentActivity={viewModel.recentActivity}
          onUploadCityAip={handlers.onUploadCityAip}
          onViewAudit={handlers.onViewAudit}
        />

        <CitizenEngagementPulseColumn
          kpis={viewModel.pulseKpis}
          trendSeries={viewModel.trendSeries}
          targetsSeries={viewModel.targetsSeries}
          recentFeedback={viewModel.recentFeedback}
        />
      </div>
    </div>
  );
}
