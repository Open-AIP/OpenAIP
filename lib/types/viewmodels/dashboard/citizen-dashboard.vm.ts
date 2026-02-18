import type { CitizenScopeType } from "@/lib/repos/citizen-dashboard/types";

export type CitizenDashboardLocationOption = {
  value: string;
  label: string;
  scope_type: CitizenScopeType;
};

export type CitizenDashboardBudgetSummaryVM = {
  fiscalYear: number;
  scopeLabel: string;
  totalBudget: number;
  totalProjects: number;
  healthTotal: number;
  infrastructureTotal: number;
  otherTotal: number;
  lastPublishedAt: string | null;
};

export type CitizenDashboardCategoryAllocationVM = {
  sectorCode: string;
  sectorLabel: string;
  amount: number;
  percent: number;
  projectCount: number;
  colorToken: string;
};

export type CitizenDashboardHighlightProjectVM = {
  projectId: string;
  title: string;
  projectType: "health" | "infrastructure" | "other";
  sectorLabel: string;
  budget: number;
  scopeName: string;
  fiscalYear: number;
  publishedAt: string | null;
  imageUrl: string;
  href: string;
};

export type CitizenDashboardProjectCardVM = {
  projectId: string;
  rank: number;
  title: string;
  projectType: "health" | "infrastructure" | "other";
  sectorLabel: string;
  budget: number;
  publishedAt: string | null;
  statusLabel: string;
  href: string;
};

export type CitizenDashboardAipStatusSummaryVM = {
  publishedCount: number;
  latestPublishedAt: string | null;
  totalPublishedBudget: number;
  totalPublishedProjects: number;
  statusBadge: "published" | "empty";
};

export type CitizenDashboardTransparencyStepVM = {
  stepKey: "prepared" | "submitted" | "reviewed" | "approved" | "published";
  label: string;
  description: string;
  count: number;
  lastEventAt: string | null;
  state: "complete" | "pending";
};

export type CitizenDashboardLguStatusRowVM = {
  aipId: string;
  lguName: string;
  lguType: "City" | "Barangay";
  fiscalYear: number;
  publishedDate: string | null;
  projectCount: number;
  totalBudget: number;
  statusLabel: "Published";
  href: string;
};

export type CitizenDashboardPublishedAipCardVM = {
  aipId: string;
  title: string;
  scopeName: string;
  scopeType: CitizenScopeType;
  fiscalYear: number;
  publishedDate: string | null;
  fileName: string;
  totalBudget: number;
  href: string;
};

export type CitizenDashboardVM = {
  hero: {
    title: string;
    scopeLabel: string;
    subtitle: string;
  };
  controls: {
    locationOptions: CitizenDashboardLocationOption[];
    selectedScopeType: CitizenScopeType;
    selectedScopeId: string;
    fiscalYearOptions: number[];
    selectedFiscalYear: number;
    search: string;
  };
  budgetSummary: CitizenDashboardBudgetSummaryVM;
  categoryAllocation: CitizenDashboardCategoryAllocationVM[];
  highlightProjects: CitizenDashboardHighlightProjectVM[];
  topProjects: CitizenDashboardProjectCardVM[];
  aipStatusSummary: CitizenDashboardAipStatusSummaryVM;
  transparencyJourney: CitizenDashboardTransparencyStepVM[];
  lguStatusBoard: CitizenDashboardLguStatusRowVM[];
  recentlyPublishedAips: CitizenDashboardPublishedAipCardVM[];
};

