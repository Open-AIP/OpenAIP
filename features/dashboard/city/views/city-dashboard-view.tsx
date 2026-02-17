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
  BudgetBreakdownVM,
  CityAipByYearVM,
  CityAipCoverageVM,
  KpiCardVM,
  ProjectUpdateItemVM,
  RecentActivityItemVM,
  SelectOption,
  TopProjectRowVM,
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

const MOCK_BUDGET_BREAKDOWN: BudgetBreakdownVM = {
  totalBudget: 128_500_000,
  segments: [
    { label: "General", percent: 29, value: 37_265_000, colorClass: "text-teal-700" },
    { label: "Social", percent: 41, value: 52_685_000, colorClass: "text-blue-500" },
    { label: "Economic", percent: 22, value: 28_270_000, colorClass: "text-emerald-500" },
    { label: "Other", percent: 8, value: 10_280_000, colorClass: "text-amber-500" },
  ],
};

const MOCK_TOP_FUNDED_PROJECTS: TopProjectRowVM[] = [
  {
    id: "p-001",
    rank: 1,
    projectName: "Main Road Rehabilitation",
    category: "Economic",
    type: "infrastructure",
    budget: 5_000_000,
    status: "ongoing",
  },
  {
    id: "p-002",
    rank: 2,
    projectName: "Health Center Equipment Upgrade",
    category: "Social",
    type: "health",
    budget: 2_500_000,
    status: "ongoing",
  },
  {
    id: "p-003",
    rank: 3,
    projectName: "Community Sports Complex",
    category: "General",
    type: "infrastructure",
    budget: 1_800_000,
    status: "planning",
  },
  {
    id: "p-004",
    rank: 4,
    projectName: "Medical Outreach Program",
    category: "Social",
    type: "health",
    budget: 1_200_000,
    status: "ongoing",
  },
  {
    id: "p-005",
    rank: 5,
    projectName: "Bridge Construction Project",
    category: "Economic",
    type: "infrastructure",
    budget: 950_000,
    status: "planning",
  },
  {
    id: "p-006",
    rank: 6,
    projectName: "Youth Development Initiative",
    category: "Social",
    type: "health",
    budget: 750_000,
    status: "ongoing",
  },
  {
    id: "p-007",
    rank: 7,
    projectName: "Senior Citizen Wellness",
    category: "Social",
    type: "health",
    budget: 680_000,
    status: "planning",
  },
  {
    id: "p-008",
    rank: 8,
    projectName: "Drainage System Improvement",
    category: "Economic",
    type: "infrastructure",
    budget: 520_000,
    status: "on_hold",
  },
  {
    id: "p-009",
    rank: 9,
    projectName: "Street Lighting Enhancement",
    category: "General",
    type: "infrastructure",
    budget: 420_000,
    status: "planning",
  },
  {
    id: "p-010",
    rank: 10,
    projectName: "Vaccination Drive 2026",
    category: "Social",
    type: "health",
    budget: 380_000,
    status: "ongoing",
  },
];

const MOCK_RECENT_PROJECT_UPDATES: ProjectUpdateItemVM[] = [
  { id: "u-001", title: "Medical Mission Complete", category: "Health Outreach", date: "2026-02-12", metaRight: "250 attendees" },
  { id: "u-002", title: "Vaccination Drive", category: "Immunization Program", date: "2026-02-08", metaRight: "180 advised" },
  { id: "u-003", title: "Road Base Course Completed", category: "Infrastructure", date: "2026-02-03", metaRight: "64 attendees" },
  { id: "u-004", title: "Bridge Safety Inspection", category: "Infrastructure", date: "2026-01-29", metaRight: "22 attendees" },
  { id: "u-005", title: "Nutrition Counseling Session", category: "Health", date: "2026-01-26", metaRight: "95 attendees" },
  { id: "u-006", title: "Street Lighting Installation", category: "Infrastructure", date: "2026-01-20", metaRight: "41 attendees" },
];

const MOCK_RECENT_ACTIVITY: RecentActivityItemVM[] = [
  { id: "a-001", title: "Draft created", subtitle: "AIP 2026", timestamp: "2026-02-14 16:50", tag: "AIP" },
  { id: "a-002", title: "Update posted", subtitle: "Medical Outreach Program", timestamp: "2026-02-13 15:36", tag: "Project" },
  { id: "a-003", title: "Comment replied", subtitle: "Bridge Construction", timestamp: "2026-02-12 19:29", tag: "Comment" },
  { id: "a-004", title: "Project completed", subtitle: "Youth Development", timestamp: "2026-02-11 14:40", tag: "Project" },
  { id: "a-005", title: "Update posted", subtitle: "Main Road Rehabilitation", timestamp: "2026-02-10 11:05", tag: "Project" },
  { id: "a-006", title: "Comment replied", subtitle: "AIP 2026", timestamp: "2026-02-09 16:30", tag: "Comment" },
  { id: "a-007", title: "Project created", subtitle: "Vaccination Drive", timestamp: "2026-02-08 13:15", tag: "Project" },
  { id: "a-008", title: "Update posted", subtitle: "Bridge Construction", timestamp: "2026-02-07 10:45", tag: "Project" },
];

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
    const search = topProjectFilters.search.trim().toLowerCase();

    return MOCK_TOP_FUNDED_PROJECTS.filter((project) => {
      const matchesCategory =
        topProjectFilters.category === "all" || project.category.toLowerCase() === topProjectFilters.category;
      const matchesType = topProjectFilters.type === "all" || project.type === topProjectFilters.type;
      const matchesSearch =
        search.length === 0 ||
        project.projectName.toLowerCase().includes(search) ||
        project.category.toLowerCase().includes(search);

      return matchesCategory && matchesType && matchesSearch;
    }).map((row, index) => ({ ...row, rank: index + 1 }));
  }, [topProjectFilters]);

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
        breakdown={MOCK_BUDGET_BREAKDOWN}
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
          recentActivity={MOCK_RECENT_ACTIVITY}
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
            items={MOCK_RECENT_PROJECT_UPDATES}
            onItemClick={(id) => console.info("[UI-only] Recent project update clicked", { id })}
          />
        </div>
      </div>
    </div>
  );
}