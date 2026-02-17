import type { AipStatus, ProjectCategory } from "@/lib/contracts/databasev2/enums";
import type { ProjectStatus } from "@/lib/repos/projects/types";
import type { DashboardSectorFilter } from "@/lib/constants/dashboard";

export type DashboardKpiIcon =
  | "file-clock"
  | "clock"
  | "git-pull-request"
  | "user-check"
  | "file-text"
  | "folder"
  | "wallet"
  | "message-square";

export type SelectOption = {
  label: string;
  value: string | number;
};

export type KpiCardVM = {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  icon?: DashboardKpiIcon;
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
  sector_code: DashboardSectorFilter;
  type: ProjectCategory;
  budget: number;
  status: ProjectStatus;
};

export type TopProjectsFiltersVM = {
  sector_code: DashboardSectorFilter;
  type: string;
  search: string;
};

export type TopProjectsFilterChange = {
  sector_code?: DashboardSectorFilter;
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
