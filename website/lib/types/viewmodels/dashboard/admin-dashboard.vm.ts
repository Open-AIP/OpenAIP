import type {
  AdminDashboardFilters,
  AipStatusDistributionVM,
  DashboardSummaryVM,
  LguOptionVM,
  RecentActivityItemVM,
  ReviewBacklogVM,
  UsageMetricsVM,
} from "@/lib/repos/admin-dashboard/types";

export type { AdminDashboardFilters };

export type AdminDashboardKpiVM = {
  title: string;
  value: string;
  deltaLabel: string;
  iconClassName: string;
  ctaLabel: string;
  path: string;
  tagLabel?: string;
};

export type AdminDashboardVM = {
  safeSummary: DashboardSummaryVM;
  distribution: AipStatusDistributionVM[];
  reviewBacklog: ReviewBacklogVM | null;
  usageMetrics: UsageMetricsVM | null;
  recentActivity: RecentActivityItemVM[];
  lguOptions: LguOptionVM[];
  kpis: AdminDashboardKpiVM[];
};
