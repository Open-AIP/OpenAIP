import type { BarangayDashboardFilters } from "@/lib/repos/barangay-dashboard/repo";
import type {
  BudgetBreakdownVM,
  CityAipByYearVM,
  CityAipCoverageVM,
  DateCardVM,
  KpiCardVM,
  ProjectUpdateItemVM,
  PublicationTimelinePointVM,
  PulseKpisVM,
  RecentActivityItemVM,
  RecentFeedbackItemVM,
  SelectOption,
  TargetPointVM,
  TopProjectsFiltersVM,
  TopProjectRowVM,
  TrendPointVM,
  WorkingOnVM,
} from "./shared-dashboard.vm";

export type { BarangayDashboardFilters };
export type { BarangayDashboardData } from "@/lib/repos/barangay-dashboard/repo";

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
