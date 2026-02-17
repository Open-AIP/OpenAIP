import { getAipStatusLabel } from "@/lib/mappers/submissions";
import { formatNumber, formatPeso } from "@/lib/formatting";
import {
  DASHBOARD_SECTOR_FILTER_OPTIONS,
  getSectorShortLabel,
} from "@/lib/constants/dashboard";
import type { BarangayDashboardData, BarangayDashboardFilters } from "@/lib/repos/barangay-dashboard/repo";
import type { BarangayDashboardVM } from "@/lib/types/viewmodels/dashboard/barangay-dashboard.vm";

const TOP_PROJECT_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Health", value: "health" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Other", value: "other" },
] as const;

type MapBarangayDashboardVMInput = {
  data: BarangayDashboardData | null;
  filters: BarangayDashboardFilters;
  fiscal_year: number;
  scope: {
    scope_type: string;
    scope_id: string;
  };
  availableYears: number[];
};

export function mapBarangayDashboardToVM({
  data,
  filters,
  fiscal_year,
  scope,
  availableYears,
}: MapBarangayDashboardVMInput): BarangayDashboardVM | null {
  if (!data) return null;
  const totalBudget = data.budgetBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return {
    header: {
      title: "Welcome to OpenAIP",
      year: fiscal_year,
      yearOptions: availableYears.map((year) => ({ label: String(year), value: year })),
      search: filters.globalSearch,
    },
    kpis: [
      {
        id: "aip-status",
        label: "AIP Status",
        value: getAipStatusLabel(data.aipStatus.status),
        subtext: `${data.aipStatus.asOfLabel} · ${data.aipStatus.lastUpdatedLabel}`,
        icon: "file-text",
        tone: "warning",
      },
      {
        id: "projects",
        label: "Total Projects",
        value: formatNumber(data.totalProjects.total),
        subtext: `Health: ${data.totalProjects.healthCount} · Infra: ${data.totalProjects.infrastructureCount}`,
        icon: "folder",
        tone: "info",
      },
      {
        id: "budget",
        label: "Total Budget",
        value: formatPeso(totalBudget),
        subtext: `Based on project totals for ${fiscal_year}`,
        icon: "wallet",
        tone: "success",
      },
      {
        id: "feedback",
        label: "Citizen Feedback",
        value: `${formatNumber(data.citizenFeedback.totalComments)} Comments`,
        subtext: `${data.citizenFeedback.awaitingReply} awaiting replies`,
        icon: "message-square",
        tone: "warning",
        badgeText: data.citizenFeedback.awaitingReply > 0 ? data.citizenFeedback.actionRequiredLabel : undefined,
      },
    ],
    budgetBreakdown: {
      totalBudget,
      segments: data.budgetBreakdown.map((item) => ({
        label: item.label,
        percent: item.percent,
        value: item.amount,
        colorClass: item.colorClass,
      })),
    },
    dateCard: { ...data.dateCard },
    workingOn: {
      isEmpty: data.workingOn.isCaughtUp,
      emptyLabel: data.workingOn.emptyLabel,
      items: data.workingOn.items.map((item) => ({ title: item.title, status: "Open", meta: item.href })),
    },
    topFunded: {
      rows: data.topFundedProjects.map((row) => ({
        id: row.id,
        rank: row.rank,
        projectName: row.projectName,
        category: getSectorShortLabel(row.sector_code),
        sector_code: row.sector_code,
        type: row.projectType,
        budget: row.budget,
        status: row.projectStatus,
      })),
      filters: {
        sector_code: filters.sector_code,
        type: filters.projectType,
        search: filters.tableSearch,
      },
      categoryOptions: [...DASHBOARD_SECTOR_FILTER_OPTIONS],
      typeOptions: [...TOP_PROJECT_TYPE_OPTIONS],
    },
    recentProjectUpdates: data.recentProjectUpdates.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category === "health" ? "Health" : "Infrastructure",
      date: item.date,
      metaRight: `${formatNumber(item.attendees)} attendees`,
    })),
    cityAipCoverage: {
      status: data.cityAipStatus.hasCityAipForYear ? "available" : "missing",
      message: data.cityAipStatus.description,
      ctaLabel: `Upload City AIP for ${fiscal_year}`,
    },
    publicationTimeline: data.publicationTimeline.map((item) => ({ year: item.year, value: item.publishedCount })),
    cityAipsByYear: data.cityAipsByYear.map((item) => ({
      id: item.id,
      year: item.year,
      status: item.status,
      uploadedBy: item.uploadedBy,
      uploadDate: item.uploadDate,
    })),
    recentActivity: data.recentActivity.map((item) => ({
      id: item.id,
      title: item.action,
      timestamp: item.timestamp,
      tag: item.tag,
    })),
    pulseKpis: {
      newThisWeek: data.engagementPulse.newThisWeek,
      awaitingReply: data.engagementPulse.awaitingReply,
      hidden: data.engagementPulse.hidden,
    },
    trendSeries: data.engagementPulse.feedbackTrend,
    targetsSeries: data.engagementPulse.feedbackTargets,
    recentFeedback: data.recentFeedback.map((item) => ({
      id: item.id,
      scopeTag: "Feedback",
      title: item.title,
      snippet: item.subtitle,
      author: "Citizen",
      timeAgo: item.date,
    })),
    aipDetailsHref: data.budgetActions.aipDetailsHref ?? `/${scope.scope_type}/aips/${scope.scope_id}`,
    cityAipUploadLabel: `Upload City AIP for ${fiscal_year}`,
  };
}
