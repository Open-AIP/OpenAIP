"use client";

import { useMemo, useState } from "react";
import { Clock3, FileClock, GitPullRequestArrow, UserRoundCheck } from "lucide-react";
import { BarChartCard, PieChartCard } from "@/features/dashboard/components/charts";
import DashboardHeader from "@/features/dashboard/barangay/components/DashboardHeader";
import KpiRow from "@/features/dashboard/barangay/components/KpiRow";
import BudgetBreakdownSection from "@/features/dashboard/barangay/components/BudgetBreakdownSection";
import TopFundedProjectsSection from "@/features/dashboard/barangay/components/TopFundedProjectsSection";
import RecentProjectUpdatesCard from "@/features/dashboard/barangay/components/RecentProjectUpdatesCard";
import CityAipStatusColumn from "@/features/dashboard/barangay/components/CityAipStatusColumn";
import CitizenEngagementPulseColumn from "@/features/dashboard/barangay/components/CitizenEngagementPulseColumn";
import { getAipStatusLabel } from "@/features/submissions/presentation/submissions.presentation";
import { formatNumber } from "@/lib/formatting";
import { useCityDashboard } from "../hooks/useCityDashboard";
import type {
  CityAipByYearVM,
  CityAipCoverageVM,
  KpiCardVM,
  SelectOption,
  TopProjectsFiltersVM,
} from "@/features/dashboard/barangay/types";
import type { AipStatus } from "@/lib/contracts/databasev2/enums";

const AIP_STATUS_ORDER: AipStatus[] = ["draft", "pending_review", "under_review", "for_revision", "published"];

const AIP_STATUS_COLOR: Record<AipStatus, string> = {
  draft: "#94a3b8",
  pending_review: "#eab308",
  under_review: "#3b82f6",
  for_revision: "#f97316",
  published: "#22c55e",
};

const TOP_PROJECT_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "All Categories", value: "all" },
  { label: "Economic", value: "economic" },
  { label: "Social", value: "social" },
  { label: "General", value: "general" },
  { label: "Other", value: "other" },
];

const TOP_PROJECT_TYPE_OPTIONS: SelectOption[] = [
  { label: "All Types", value: "all" },
  { label: "Health", value: "health" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Other", value: "other" },
];

const DEFAULT_TOP_PROJECT_FILTERS: TopProjectsFiltersVM = {
  search: "",
  category: "all",
  type: "all",
};

export default function CityDashboardView() {
  const { filters, data, isLoading, error, availableYears, setYear, setSearch } = useCityDashboard();
  const [topProjectFilters, setTopProjectFilters] = useState<TopProjectsFiltersVM>(DEFAULT_TOP_PROJECT_FILTERS);

  const kpiCards = useMemo<KpiCardVM[]>(() => {
    if (!data) return [];

    return [
      {
        id: "pending-review",
        label: "Pending Review",
        value: formatNumber(data.queueMetrics.pendingReview),
        subtext: data.queueMetrics.asOfLabel,
        icon: FileClock,
        tone: "warning",
      },
      {
        id: "under-review",
        label: "Under Review",
        value: formatNumber(data.queueMetrics.underReview),
        subtext: data.queueMetrics.asOfLabel,
        icon: Clock3,
        tone: "info",
      },
      {
        id: "for-revision",
        label: "For Revision",
        value: formatNumber(data.queueMetrics.forRevision),
        subtext: data.queueMetrics.asOfLabel,
        icon: GitPullRequestArrow,
        tone: "warning",
      },
      {
        id: "available-claim",
        label: "Available to Claim",
        value: formatNumber(data.queueMetrics.availableToClaim),
        subtext: data.queueMetrics.availableToClaimLabel,
        icon: UserRoundCheck,
        tone: "success",
      },
      {
        id: "oldest-pending",
        label: "Oldest Pending",
        value: formatNumber(data.queueMetrics.oldestPendingDays),
        subtext: "days in queue",
        tone: "neutral",
      },
    ];
  }, [data]);

  const workingOn = useMemo(() => {
    if (!data) {
      return { isEmpty: true, items: [], emptyLabel: "All Caught Up" };
    }

    return {
      isEmpty: data.workingOn.length === 0,
      emptyLabel: "All Caught Up",
      items: data.workingOn.map((item) => ({
        title: item.barangayName,
        status: getAipStatusLabel(item.status),
        meta: `in status for ${item.daysInStatus} days`,
      })),
    };
  }, [data]);

  const filteredTopProjects = useMemo(() => {
    if (!data) return [];

    const search = topProjectFilters.search.trim().toLowerCase();

    return data.topFundedProjects.filter((project) => {
      const matchesCategory =
        topProjectFilters.category === "all" || project.category.toLowerCase() === topProjectFilters.category;
      const matchesType = topProjectFilters.type === "all" || project.type === topProjectFilters.type;
      const matchesSearch =
        search.length === 0 ||
        project.projectName.toLowerCase().includes(search) ||
        project.category.toLowerCase().includes(search);

      return matchesCategory && matchesType && matchesSearch;
    }).map((row, index) => ({ ...row, rank: index + 1 }));
  }, [topProjectFilters, data]);

  const cityAipCoverage = useMemo<CityAipCoverageVM>(() => {
    if (!data) {
      return {
        status: "missing",
        message: "Unable to determine City AIP coverage.",
        ctaLabel: `Upload City AIP for ${filters.year}`,
      };
    }

    return {
      status: data.cityAipStatus.hasCityAipForYear ? "available" : "missing",
      message: data.cityAipStatus.warningMessage,
      ctaLabel: `Upload City AIP for ${filters.year}`,
    };
  }, [data, filters.year]);

  const cityAipsByYear = useMemo<CityAipByYearVM[]>(() => {
    if (!data) return [];

    return data.cityAipsByYear.map((row) => ({
      id: row.id,
      year: row.year,
      status: row.status,
      uploadedBy: row.uploadedBy,
      uploadDate: row.uploadDate,
      onView: () => {
        console.info("[UI-only] View City AIP row clicked", { id: row.id, href: row.actionHref });
      },
    }));
  }, [data]);

  const orderedStatusDistribution = useMemo(
    () =>
      data
        ? [...data.statusDistribution].sort(
            (a, b) => AIP_STATUS_ORDER.indexOf(a.status) - AIP_STATUS_ORDER.indexOf(b.status)
          )
        : [],
    [data]
  );

  if (isLoading && !data) {
    return <div className="text-sm text-slate-500">Loading city dashboard...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-rose-600">{error ?? "Unable to load dashboard."}</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader
        year={filters.year}
        yearOptions={availableYears.map((year) => ({ label: String(year), value: year }))}
        search={filters.search}
        onYearChange={(value) => setYear(Number(value))}
        onSearchChange={setSearch}
      />

      <KpiRow cards={kpiCards} />

      <BudgetBreakdownSection
        breakdown={data.budgetBreakdown}
        dateCard={data.dateCard}
        workingOn={workingOn}
        aipDetailsHref="/city/aips"
        onViewAipDetails={() => console.info("[UI-only] View AIP details clicked")}
        onViewAllProjects={() => console.info("[UI-only] View all projects clicked")}
      />

      <div className="grid gap-6 xl:grid-cols-[7fr_3fr]">
        <TopFundedProjectsSection
          rows={filteredTopProjects}
          filters={topProjectFilters}
          categoryOptions={TOP_PROJECT_CATEGORY_OPTIONS}
          typeOptions={TOP_PROJECT_TYPE_OPTIONS}
          onFilterChange={(change) => setTopProjectFilters((prev) => ({ ...prev, ...change }))}
        />
        <div className="space-y-4">
          <PieChartCard
            title="Status Distribution"
            series={{
              data: orderedStatusDistribution.map((item) => ({ name: item.status.replaceAll("_", " "), value: item.count })),
              outerRadius: 92,
            }}
            palette={orderedStatusDistribution.map((item) => AIP_STATUS_COLOR[item.status])}
            showLabels
            height={230}
          />

          <BarChartCard
            title="Pending Review Aging"
            series={{
              data: data.pendingReviewAging.map((item) => ({ bucket: item.label, count: item.count })),
              xKey: "bucket",
              bars: [{ key: "count", label: "Count", fill: "#0f766e" }],
            }}
            showLegend={false}
            showGrid
            height={210}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CityAipStatusColumn
          cityAipCoverage={cityAipCoverage}
          publicationTimeline={data.publicationTimeline.map((point) => ({
            year: point.year,
            value: point.publishedCount,
          }))}
          cityAipsByYear={cityAipsByYear}
          recentActivity={data.recentActivity}
          onUploadCityAip={() => console.info("[UI-only] Upload City AIP clicked", { year: filters.year })}
          onViewAudit={() => console.info("[UI-only] View audit clicked")}
        />

        <div className="space-y-6">
          <CitizenEngagementPulseColumn
            kpis={{
              newThisWeek: data.engagementPulse.newThisWeek,
              awaitingReply: data.engagementPulse.awaitingReply,
              hidden: data.engagementPulse.moderated,
            }}
            trendSeries={data.engagementPulse.commentsTrend.map((point) => ({
              label: point.label,
              value: point.value,
            }))}
            targetsSeries={data.engagementPulse.commentTargets.map((point) => ({
              label: point.category,
              count: point.count,
            }))}
            recentFeedback={data.recentComments.map((comment) => ({
              id: comment.id,
              scopeTag: comment.sourceLabel,
              title: comment.title,
              snippet: comment.snippet,
              author: comment.author,
              timeAgo: comment.timestampLabel,
            }))}
          />

          <RecentProjectUpdatesCard
            items={data.recentProjectUpdates}
            onItemClick={(id) => console.info("[UI-only] Recent project update clicked", { id })}
          />
        </div>
      </div>
    </div>
  );
}