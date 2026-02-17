import {
  BARANGAY_DASHBOARD_DEFAULT_YEAR,
  BARANGAY_DASHBOARD_FIXTURES,
} from "@/mocks/fixtures/barangay/barangay-dashboard.fixture";
import type {
  BarangayDashboardData,
  BarangayDashboardFilters,
  BarangayDashboardRepo,
  TopFundedProjectRow,
} from "./types";

function cloneData(data: BarangayDashboardData): BarangayDashboardData {
  return {
    ...data,
    scope: { ...data.scope },
    availableYears: [...data.availableYears],
    aipStatus: { ...data.aipStatus },
    totalProjects: { ...data.totalProjects },
    budgetBreakdown: data.budgetBreakdown.map((item) => ({ ...item })),
    citizenFeedback: { ...data.citizenFeedback },
    dateCard: { ...data.dateCard },
    workingOn: {
      ...data.workingOn,
      items: data.workingOn.items.map((item) => ({ ...item })),
    },
    budgetActions: { ...data.budgetActions },
    topFundedProjects: data.topFundedProjects.map((item) => ({ ...item })),
    recentProjectUpdates: data.recentProjectUpdates.map((item) => ({ ...item })),
    cityAipStatus: { ...data.cityAipStatus },
    publicationTimeline: data.publicationTimeline.map((item) => ({ ...item })),
    cityAipsByYear: data.cityAipsByYear.map((item) => ({ ...item })),
    recentActivity: data.recentActivity.map((item) => ({ ...item })),
    engagementPulse: {
      ...data.engagementPulse,
      feedbackTrend: data.engagementPulse.feedbackTrend.map((item) => ({ ...item })),
      feedbackTargets: data.engagementPulse.feedbackTargets.map((item) => ({ ...item })),
    },
    recentFeedback: data.recentFeedback.map((item) => ({ ...item })),
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function filterTopFundedProjects(
  filters: BarangayDashboardFilters,
  rows: TopFundedProjectRow[]
): TopFundedProjectRow[] {
  return rows
    .filter((row) => (filters.sector === "all" ? true : row.sector === filters.sector))
    .filter((row) => (filters.projectType === "all" ? true : row.projectType === filters.projectType))
    .filter((row) => {
      const query = normalize(filters.tableSearch);
      if (!query) return true;

      return [
        row.projectName,
        row.projectStatus,
        row.projectType,
        row.sector,
        String(row.rank),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
}

function filterRecentProjectUpdates(query: string, titles: BarangayDashboardData["recentProjectUpdates"]) {
  const needle = normalize(query);
  if (!needle) return titles;

  return titles.filter((item) => {
    return [item.title, item.category, item.date, String(item.attendees)]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

function filterRecentActivity(query: string, rows: BarangayDashboardData["recentActivity"]) {
  const needle = normalize(query);
  if (!needle) return rows;

  return rows.filter((item) => {
    return [item.action, item.timestamp, item.tag].join(" ").toLowerCase().includes(needle);
  });
}

function filterCityAipsByYear(query: string, rows: BarangayDashboardData["cityAipsByYear"]) {
  const needle = normalize(query);
  if (!needle) return rows;

  return rows.filter((item) => {
    return [String(item.year), item.uploadedBy, item.status, item.uploadDate]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

export function createMockBarangayDashboardRepo(): BarangayDashboardRepo {
  return {
    async listAvailableYears() {
      const fallback = BARANGAY_DASHBOARD_FIXTURES[BARANGAY_DASHBOARD_DEFAULT_YEAR];
      return fallback.availableYears;
    },
    async getDashboard(filters) {
      const fallback = BARANGAY_DASHBOARD_FIXTURES[BARANGAY_DASHBOARD_DEFAULT_YEAR];
      const selected = BARANGAY_DASHBOARD_FIXTURES[filters.year] ?? fallback;
      const data = cloneData(selected);

      data.topFundedProjects = filterTopFundedProjects(filters, data.topFundedProjects);
      data.recentProjectUpdates = filterRecentProjectUpdates(filters.globalSearch, data.recentProjectUpdates);
      data.recentActivity = filterRecentActivity(filters.globalSearch, data.recentActivity);
      data.cityAipsByYear = filterCityAipsByYear(filters.globalSearch, data.cityAipsByYear);

      return data;
    },
  };
}
