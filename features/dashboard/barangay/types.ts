import type { LucideIcon } from "lucide-react";
import type { AipStatus, ProjectCategory } from "@/lib/contracts/databasev2/enums";
import type { BarangayDashboardFilters } from "@/lib/repos/barangay-dashboard/repo";
import type { ProjectStatus } from "@/lib/repos/projects/types";

export type { BarangayDashboardFilters };
export type { BarangayDashboardData } from "@/lib/repos/barangay-dashboard/repo";

export type SelectOption = {
  label: string;
  value: string | number;
};

export type KpiCardVM = {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "info" | "success" | "warning";
  badgeText?: string;
  onClick?: () => void;
};

export type BudgetSegmentVM = {
  label: string;
  percent: number;
  value: number;
  colorClass: string;
};

export type BudgetBreakdownVM = {
  totalBudget: number;
  segments: BudgetSegmentVM[];
};

export type DateCardVM = {
  day: string;
  weekday: string;
  month: string;
  year: number;
};

export type WorkingOnItemVM = {
  title: string;
  status: string;
  meta?: string;
};

export type WorkingOnVM = {
  isEmpty: boolean;
  items: WorkingOnItemVM[];
  emptyLabel: string;
};

export type TopProjectRowVM = {
  id: string;
  rank: number;
  projectName: string;
  category: string;
  type: ProjectCategory;
  budget: number;
  status: ProjectStatus;
};

export type TopProjectsFiltersVM = {
  category: string;
  type: string;
  search: string;
};

export type TopProjectsFilterChange = {
  category?: string;
  type?: string;
  search?: string;
};

export type ProjectUpdateItemVM = {
  id: string;
  title: string;
  category: string;
  date: string;
  metaRight?: string;
};

export type PublicationTimelinePointVM = {
  year: number;
  value: number;
};

export type CityAipCoverageVM = {
  status: "missing" | "available";
  message: string;
  ctaLabel?: string;
};

export type CityAipByYearVM = {
  id: string;
  year: number;
  status: AipStatus;
  uploadedBy: string;
  uploadDate: string;
  onView?: () => void;
};

export type RecentActivityItemVM = {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  tag?: string;
};

export type TrendPointVM = {
  label: string;
  value: number;
};

export type TargetPointVM = {
  label: string;
  count: number;
};

export type PulseKpisVM = {
  newThisWeek: number;
  awaitingReply: number;
  hidden: number;
};

export type RecentFeedbackItemVM = {
  id: string;
  scopeTag: string;
  title: string;
  snippet: string;
  author: string;
  timeAgo: string;
};

export type BarangayDashboardVM = {
  header: {
    title: string;
    year: number;
    yearOptions: SelectOption[];
    search: string;
  };
  kpis: KpiCardVM[];
  budgetBreakdown: BudgetBreakdownVM;
  dateCard: DateCardVM;
  workingOn: WorkingOnVM;
  topFunded: {
    rows: TopProjectRowVM[];
    filters: TopProjectsFiltersVM;
    categoryOptions: SelectOption[];
    typeOptions: SelectOption[];
  };
  recentProjectUpdates: ProjectUpdateItemVM[];
  cityAipCoverage: CityAipCoverageVM;
  publicationTimeline: PublicationTimelinePointVM[];
  cityAipsByYear: CityAipByYearVM[];
  recentActivity: RecentActivityItemVM[];
  pulseKpis: PulseKpisVM;
  trendSeries: TrendPointVM[];
  targetsSeries: TargetPointVM[];
  recentFeedback: RecentFeedbackItemVM[];
  aipDetailsHref: string;
  cityAipUploadLabel: string;
};
