"use client";

import BudgetBreakdownSection from "@/features/dashboard/shared/components/BudgetBreakdownSection";
import CitizenEngagementPulseColumn from "@/features/dashboard/shared/components/CitizenEngagementPulseColumn";
import CityAipStatusColumn from "@/features/dashboard/shared/components/CityAipStatusColumn";
import DashboardHeader from "@/features/dashboard/shared/components/DashboardHeader";
import KpiRow from "@/features/dashboard/shared/components/KpiRow";
import RecentProjectUpdatesCard from "@/features/dashboard/shared/components/RecentProjectUpdatesCard";
import TopFundedProjectsSection from "@/features/dashboard/shared/components/TopFundedProjectsSection";
import { useBarangayDashboard } from "../hooks/useBarangayDashboard";
import type { BarangayDashboardActions } from "../types/dashboard-actions";

type BarangayDashboardPageProps = {
  actions: BarangayDashboardActions;
};

export default function BarangayDashboardPage({ actions }: BarangayDashboardPageProps) {
  const { isLoading, error, viewModel, setYear, setGlobalSearch, setTopProjectsFilters } = useBarangayDashboard();

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
        onViewAipDetails={() => actions.onViewAip({ fiscal_year: viewModel.header.year })}
        onViewAllProjects={() => actions.onViewProjects({ fiscal_year: viewModel.header.year })}
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
          onUploadCityAip={() => actions.onUploadAip({ fiscal_year: viewModel.header.year })}
          onViewAudit={actions.onViewAuditTrail}
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
