import { Clock3, FileClock, GitPullRequestArrow, UserRoundCheck } from "lucide-react";
import { getAipStatusLabel } from "@/lib/mappers/submissions";
import { formatNumber } from "@/lib/formatting";
import {
  CITY_TOP_PROJECT_CATEGORY_OPTIONS,
  CITY_TOP_PROJECT_TYPE_OPTIONS,
  DASHBOARD_AIP_STATUS_ORDER,
  getSectorShortLabel,
  type DashboardSectorCode,
} from "@/lib/constants/dashboard";
import type {
  CityDashboardData,
  CityDashboardFilters,
} from "@/lib/repos/city-dashboard/types";
import type {
  CityDashboardVM,
} from "@/lib/types/viewmodels/dashboard/city-dashboard.vm";
import type { TopProjectsFiltersVM, KpiCardVM } from "@/lib/types/viewmodels/dashboard/shared-dashboard.vm";

export const DEFAULT_CITY_TOP_PROJECT_FILTERS: TopProjectsFiltersVM = {
  search: "",
  sector_code: "all",
  type: "all",
};

type MapCityDashboardVMInput = {
  data: CityDashboardData | null;
  filters: CityDashboardFilters;
  fiscal_year: number;
  availableYears: number[];
  topProjectFilters: TopProjectsFiltersVM;
};

export function mapCityDashboardToVM({
  data,
  filters,
  fiscal_year,
  availableYears,
  topProjectFilters,
}: MapCityDashboardVMInput): CityDashboardVM | null {
  if (!data) return null;

  const kpiCards: KpiCardVM[] = [
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

  const workingOn = {
    isEmpty: data.workingOn.length === 0,
    emptyLabel: "All Caught Up",
    items: data.workingOn.map((item) => ({
      title: item.barangayName,
      status: getAipStatusLabel(item.status),
      meta: `in status for ${item.daysInStatus} days`,
    })),
  };

  const search = topProjectFilters.search.trim().toLowerCase();
  const topFundedProjects = data.topFundedProjects
    .filter((project) => {
      const projectSectorLabel = getSectorShortLabel(project.sector_code);
      const matchesSector =
        topProjectFilters.sector_code === "all" || project.sector_code === topProjectFilters.sector_code;
      const matchesType = topProjectFilters.type === "all" || project.type === topProjectFilters.type;
      const matchesSearch =
        search.length === 0 ||
        project.projectName.toLowerCase().includes(search) ||
        projectSectorLabel.toLowerCase().includes(search);

      return matchesSector && matchesType && matchesSearch;
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      category: getSectorShortLabel(row.sector_code),
      sector_code: row.sector_code as DashboardSectorCode,
    }));

  const orderedStatusDistribution = [...data.statusDistribution].sort(
    (a, b) => DASHBOARD_AIP_STATUS_ORDER.indexOf(a.status) - DASHBOARD_AIP_STATUS_ORDER.indexOf(b.status)
  );

  return {
    header: {
      year: fiscal_year,
      yearOptions: availableYears.map((year) => ({ label: String(year), value: year })),
      search: filters.search,
    },
    kpiCards,
    budgetBreakdown: data.budgetBreakdown,
    dateCard: data.dateCard,
    workingOn,
    topFundedProjects,
    topProjectFilters,
    categoryOptions: [...CITY_TOP_PROJECT_CATEGORY_OPTIONS],
    typeOptions: [...CITY_TOP_PROJECT_TYPE_OPTIONS],
    cityAipCoverage: {
      status: data.cityAipStatus.hasCityAipForYear ? "available" : "missing",
      message: data.cityAipStatus.warningMessage,
      ctaLabel: `Upload City AIP for ${fiscal_year}`,
    },
    cityAipsByYear: data.cityAipsByYear.map((row) => ({
      id: row.id,
      year: row.year,
      status: row.status,
      uploadedBy: row.uploadedBy,
      uploadDate: row.uploadDate,
      onView: undefined,
    })),
    orderedStatusDistribution,
    publicationTimeline: data.publicationTimeline.map((point) => ({
      year: point.year,
      value: point.publishedCount,
    })),
    recentActivity: data.recentActivity,
    pulse: {
      kpis: {
        newThisWeek: data.engagementPulse.newThisWeek,
        awaitingReply: data.engagementPulse.awaitingReply,
        hidden: data.engagementPulse.moderated,
      },
      trendSeries: data.engagementPulse.commentsTrend.map((point) => ({
        label: point.label,
        value: point.value,
      })),
      targetsSeries: data.engagementPulse.commentTargets.map((point) => ({
        label: point.category,
        count: point.count,
      })),
      recentFeedback: data.recentComments.map((comment) => ({
        id: comment.id,
        scopeTag: comment.sourceLabel,
        title: comment.title,
        snippet: comment.snippet,
        author: comment.author,
        timeAgo: comment.timestampLabel,
      })),
    },
    recentProjectUpdates: data.recentProjectUpdates,
  };
}
