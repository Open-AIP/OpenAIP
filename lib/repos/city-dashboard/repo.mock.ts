import {
  CITY_DASHBOARD_DEFAULT_YEAR,
  CITY_DASHBOARD_FIXTURES,
} from "@/mocks/fixtures/city/city-dashboard.fixture";
import type {
  CityDashboardData,
  CityDashboardFilters,
  CityDashboardRepo,
  RecentComment,
  WorkingQueueItem,
  CityAipSummary,
} from "./types";

function cloneData(data: CityDashboardData): CityDashboardData {
  return {
    ...data,
    scope: { ...data.scope },
    availableYears: [...data.availableYears],
    queueMetrics: { ...data.queueMetrics },
    statusDistribution: data.statusDistribution.map((item) => ({ ...item })),
    pendingReviewAging: data.pendingReviewAging.map((item) => ({ ...item })),
    dateCard: { ...data.dateCard },
    workingOn: data.workingOn.map((item) => ({ ...item })),
    cityAipStatus: { ...data.cityAipStatus },
    publicationTimeline: data.publicationTimeline.map((item) => ({ ...item })),
    cityAipsByYear: data.cityAipsByYear.map((item) => ({ ...item })),
    engagementPulse: {
      ...data.engagementPulse,
      commentsTrend: data.engagementPulse.commentsTrend.map((point) => ({ ...point })),
      commentTargets: data.engagementPulse.commentTargets.map((point) => ({ ...point })),
    },
    recentComments: data.recentComments.map((item) => ({ ...item })),
  };
}

function matchesSearch(query: string, values: string[]): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => value.toLowerCase().includes(needle));
}

function filterWorkingQueue(query: string, items: WorkingQueueItem[]): WorkingQueueItem[] {
  if (!query.trim()) return items;
  return items.filter((item) =>
    matchesSearch(query, [item.barangayName, item.status.replaceAll("_", " ")])
  );
}

function filterCityAips(query: string, items: CityAipSummary[]): CityAipSummary[] {
  if (!query.trim()) return items;
  return items.filter((item) =>
    matchesSearch(query, [
      String(item.year),
      item.uploadedBy,
      item.status.replaceAll("_", " "),
      item.uploadDate,
    ])
  );
}

function filterRecentComments(query: string, items: RecentComment[]): RecentComment[] {
  if (!query.trim()) return items;
  return items.filter((item) =>
    matchesSearch(query, [
      item.sourceLabel,
      item.title,
      item.snippet,
      item.author,
      item.timestampLabel,
    ])
  );
}

export function createMockCityDashboardRepo(): CityDashboardRepo {
  return {
    async listAvailableYears() {
      const fallback = CITY_DASHBOARD_FIXTURES[CITY_DASHBOARD_DEFAULT_YEAR];
      return fallback.availableYears;
    },
    async getDashboard(filters: CityDashboardFilters) {
      const fallback = CITY_DASHBOARD_FIXTURES[CITY_DASHBOARD_DEFAULT_YEAR];
      const selected = CITY_DASHBOARD_FIXTURES[filters.year] ?? fallback;
      const data = cloneData(selected);

      data.workingOn = filterWorkingQueue(filters.search, data.workingOn);
      data.cityAipsByYear = filterCityAips(filters.search, data.cityAipsByYear);
      data.recentComments = filterRecentComments(filters.search, data.recentComments);

      return data;
    },
  };
}
