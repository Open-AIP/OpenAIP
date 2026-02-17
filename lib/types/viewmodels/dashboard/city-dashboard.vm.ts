import type { CityDashboardData, CityDashboardFilters } from "@/lib/repos/city-dashboard/types";
import type {
  CityAipByYearVM,
  CityAipCoverageVM,
  KpiCardVM,
  TopProjectRowVM,
  TopProjectsFiltersVM,
} from "./shared-dashboard.vm";

export type { CityDashboardData, CityDashboardFilters };

export type CityDashboardVM = {
  header: {
    year: number;
    yearOptions: Array<{ label: string; value: number }>;
    search: string;
  };
  kpiCards: KpiCardVM[];
  budgetBreakdown: CityDashboardData["budgetBreakdown"];
  dateCard: CityDashboardData["dateCard"];
  workingOn: {
    isEmpty: boolean;
    emptyLabel: string;
    items: Array<{ title: string; status: string; meta: string }>;
  };
  topFundedProjects: TopProjectRowVM[];
  topProjectFilters: TopProjectsFiltersVM;
  categoryOptions: Array<{ label: string; value: string | number }>;
  typeOptions: Array<{ label: string; value: string | number }>;
  cityAipCoverage: CityAipCoverageVM;
  cityAipsByYear: CityAipByYearVM[];
  orderedStatusDistribution: CityDashboardData["statusDistribution"];
  publicationTimeline: Array<{ year: number; value: number }>;
  recentActivity: CityDashboardData["recentActivity"];
  pulse: {
    kpis: {
      newThisWeek: number;
      awaitingReply: number;
      hidden: number;
    };
    trendSeries: Array<{ label: string; value: number }>;
    targetsSeries: Array<{ label: string; count: number }>;
    recentFeedback: Array<{
      id: string;
      scopeTag: string;
      title: string;
      snippet: string;
      author: string;
      timeAgo: string;
    }>;
  };
  recentProjectUpdates: CityDashboardData["recentProjectUpdates"];
};
