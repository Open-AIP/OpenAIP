"use client";

import { BarChartCard, PieChartCard } from "@/features/dashboard/components/charts";
import DashboardHeader from "@/features/dashboard/shared/components/DashboardHeader";
import KpiRow from "@/features/dashboard/shared/components/KpiRow";
import BudgetBreakdownSection from "@/features/dashboard/shared/components/BudgetBreakdownSection";
import TopFundedProjectsSection from "@/features/dashboard/shared/components/TopFundedProjectsSection";
import RecentProjectUpdatesCard from "@/features/dashboard/shared/components/RecentProjectUpdatesCard";
import CityAipStatusColumn from "@/features/dashboard/shared/components/CityAipStatusColumn";
import CitizenEngagementPulseColumn from "@/features/dashboard/shared/components/CitizenEngagementPulseColumn";
import {
  CITY_PENDING_REVIEW_AGING_BAR_FILL,
  DASHBOARD_AIP_STATUS_COLORS,
} from "@/lib/constants/dashboard";
import { useCityDashboard } from "../hooks/useCityDashboard";

export default function CityDashboardView() {
  const {
    filters,
    data,
    isLoading,
    error,
    setYear,
    setSearch,
    viewModel,
    setTopProjectFilters,
  } = useCityDashboard();

  if (isLoading && !data) {
    return <div className="text-sm text-slate-500">Loading city dashboard...</div>;
  }

  if (error || !data || !viewModel) {
    return <div className="text-sm text-rose-600">{error ?? "Unable to load dashboard."}</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader
        year={viewModel.header.year}
        yearOptions={viewModel.header.yearOptions}
        search={viewModel.header.search}
        onYearChange={(value) => setYear(Number(value))}
        onSearchChange={setSearch}
      />

      <KpiRow cards={viewModel.kpiCards} />

      <BudgetBreakdownSection
        breakdown={viewModel.budgetBreakdown}
        dateCard={viewModel.dateCard}
        workingOn={viewModel.workingOn}
        aipDetailsHref="/city/aips"
        onViewAipDetails={() => console.info("[UI-only] View AIP details clicked")}
        onViewAllProjects={() => console.info("[UI-only] View all projects clicked")}
      />

      <div className="grid gap-6 xl:grid-cols-[7fr_3fr]">
        <TopFundedProjectsSection
          rows={viewModel.topFundedProjects}
          filters={viewModel.topProjectFilters}
          categoryOptions={viewModel.categoryOptions}
          typeOptions={viewModel.typeOptions}
          onFilterChange={(change) => setTopProjectFilters((prev) => ({ ...prev, ...change }))}
        />
        <div className="space-y-4">
          <PieChartCard
            title="Status Distribution"
            series={{
              data: viewModel.orderedStatusDistribution.map((item) => ({ name: item.status.replaceAll("_", " "), value: item.count })),
              outerRadius: 92,
            }}
            palette={viewModel.orderedStatusDistribution.map((item) => DASHBOARD_AIP_STATUS_COLORS[item.status])}
            showLabels
            height={230}
          />

          <BarChartCard
            title="Pending Review Aging"
            series={{
              data: data.pendingReviewAging.map((item) => ({ bucket: item.label, count: item.count })),
              xKey: "bucket",
              bars: [{ key: "count", label: "Count", fill: CITY_PENDING_REVIEW_AGING_BAR_FILL }],
            }}
            showLegend={false}
            showGrid
            height={210}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CityAipStatusColumn
          cityAipCoverage={viewModel.cityAipCoverage}
          publicationTimeline={viewModel.publicationTimeline}
          cityAipsByYear={viewModel.cityAipsByYear}
          recentActivity={viewModel.recentActivity}
          onUploadCityAip={() => console.info("[UI-only] Upload City AIP clicked", { year: filters.year })}
          onViewAudit={() => console.info("[UI-only] View audit clicked")}
        />

        <div className="space-y-6">
          <CitizenEngagementPulseColumn
            kpis={viewModel.pulse.kpis}
            trendSeries={viewModel.pulse.trendSeries}
            targetsSeries={viewModel.pulse.targetsSeries}
            recentFeedback={viewModel.pulse.recentFeedback}
          />

          <RecentProjectUpdatesCard
            items={viewModel.recentProjectUpdates}
            onItemClick={(id) => console.info("[UI-only] Recent project update clicked", { id })}
          />
        </div>
      </div>
    </div>
  );
}
