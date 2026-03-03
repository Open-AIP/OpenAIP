import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CityDashboardPage } from "./city-dashboard-page";
import type { DashboardData, DashboardQueryState, DashboardViewModel } from "@/features/dashboard/types/dashboard-types";
import type { ActivityLogRow } from "@/lib/repos/audit/repo";

vi.mock("@/features/dashboard/components/dashboard-header-widgets", () => ({
  DashboardHeader: ({ title }: { title: string }) => <div>{title}</div>,
  DateCard: () => <div>Date Card</div>,
  WorkingOnCard: () => <div>You&apos;re Working On</div>,
}));

vi.mock("@/features/dashboard/components/dashboard-budget-allocation", () => ({
  BudgetBreakdownSection: () => <div>Budget Breakdown</div>,
}));

vi.mock("@/features/dashboard/components/dashboard-projects-overview", () => ({
  TopFundedProjectsSection: () => <div>Top Funded Projects</div>,
}));

vi.mock("@/features/dashboard/components/dashboard-aip-publication-status", () => ({
  AipStatusColumn: () => <div>Status Distribution</div>,
  AipCoverageCard: () => <div>AIP Coverage</div>,
  AipsByYearTable: () => <div>AIPs by Year</div>,
}));

vi.mock("@/features/dashboard/components/dashboard-feedback-insights", () => ({
  CitizenEngagementPulseColumn: () => <div>Citizen Engagement Pulse</div>,
}));

vi.mock("@/features/dashboard/components/dashboard-activity-updates", () => ({
  RecentActivityFeed: () => <div>Recent Activity</div>,
  RecentProjectUpdatesCard: () => <div>Recent Project Updates</div>,
}));

vi.mock("@/features/dashboard/actions/city-dashboard-actions", () => ({
  createCityDraftAipAction: vi.fn(async () => undefined),
  replyCityFeedbackAction: vi.fn(async () => undefined),
}));

function buildData(): DashboardData {
  return {
    scope: "city",
    scopeId: "city-1",
    selectedFiscalYear: 2026,
    selectedAip: null,
    availableFiscalYears: [2026],
    allAips: [],
    projects: [],
    sectors: [],
    latestRuns: [],
    reviews: [],
    feedback: [],
    projectUpdateLogs: [],
  };
}

function buildVm(): DashboardViewModel {
  return {
    projects: [],
    budgetBySector: [
      { sectorCode: "general", label: "General", amount: 0, percentage: 0 },
      { sectorCode: "social", label: "Social", amount: 0, percentage: 0 },
      { sectorCode: "economic", label: "Economic", amount: 0, percentage: 0 },
      { sectorCode: "other", label: "Other", amount: 0, percentage: 0 },
    ],
    totalBudget: 0,
    missingTotalCount: 0,
    topFundedFiltered: [],
    citizenFeedbackCount: 0,
    awaitingReplyCount: 0,
    feedbackCategorySummary: [],
    feedbackTargets: [],
    statusDistribution: [],
    pendingReviewAging: [],
    oldestPendingDays: null,
    failedPipelineStages: 0,
    newThisWeek: 0,
    lguNotesPosted: 0,
    flaggedProjects: 0,
    workingOnItems: [],
    recentCitizenFeedback: [],
  };
}

const queryState: DashboardQueryState = {
  q: "",
  tableQ: "",
  tableCategory: "all",
  tableSector: "all",
  kpiMode: "summary",
};

describe("CityDashboardPage", () => {
  it("keeps dashboard sections visible when the selected year has no AIP", () => {
    render(
      <CityDashboardPage
        data={buildData()}
        vm={buildVm()}
        queryState={queryState}
        recentActivityLogs={[] as ActivityLogRow[]}
      />
    );

    expect(screen.getByText("Budget Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Top Funded Projects")).toBeInTheDocument();
    expect(screen.getByText("Status Distribution")).toBeInTheDocument();
    expect(screen.getByText("AIP Coverage")).toBeInTheDocument();
    expect(screen.queryByText("No AIP for 2026")).toBeNull();
  });
});
