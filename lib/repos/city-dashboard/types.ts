import type { AipStatus } from "@/lib/contracts/databasev2/enums";
import type { ProjectCategory } from "@/lib/contracts/databasev2/enums";
import type { ProjectStatus } from "@/lib/repos/projects/types";

export type CityDashboardFilters = {
  year: number;
  search: string;
  cityId: string;
};

export type ReviewQueueMetrics = {
  pendingReview: number;
  underReview: number;
  forRevision: number;
  availableToClaim: number;
  oldestPendingDays: number;
  asOfLabel: string;
  availableToClaimLabel: string;
};

export type StatusDistributionPoint = {
  status: AipStatus;
  count: number;
};

export type AgingBucket = {
  label: "0-3 days" | "4-7 days" | "8-14 days" | "15+ days";
  count: number;
};

export type WorkingQueueItem = {
  id: string;
  barangayName: string;
  status: AipStatus;
  daysInStatus: number;
};

export type PublicationTimelinePoint = {
  year: number;
  publishedCount: number;
};

export type CityAipSummary = {
  id: string;
  year: number;
  status: AipStatus;
  uploadedBy: string;
  uploadDate: string;
  actionHref: string;
};

export type EngagementPulse = {
  newThisWeek: number;
  awaitingReply: number;
  moderated: number;
  commentsTrend: Array<{ label: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"; value: number }>;
  commentTargets: Array<{
    category: "City AIPs" | "Health Projects" | "Infrastructure Projects";
    count: number;
  }>;
};

export type RecentComment = {
  id: string;
  sourceLabel: "Barangay AIP" | "City AIP" | "Project";
  title: string;
  snippet: string;
  author: string;
  timestampLabel: string;
  replyAvailable: boolean;
};

export type BudgetBreakdownSegment = {
  label: string;
  percent: number;
  value: number;
  colorClass: string;
};

export type BudgetBreakdown = {
  totalBudget: number;
  segments: BudgetBreakdownSegment[];
};

export type TopFundedProject = {
  id: string;
  rank: number;
  projectName: string;
  category: string;
  type: ProjectCategory;
  budget: number;
  status: ProjectStatus;
};

export type ProjectUpdateItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  metaRight?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  tag?: string;
};

export type DateCard = {
  day: string;
  weekday: string;
  month: string;
  year: number;
};

export type CityDashboardData = {
  scope: {
    cityId: string;
    cityName: string;
    psgcCode: string;
  };
  selectedYear: number;
  availableYears: number[];
  queueMetrics: ReviewQueueMetrics;
  statusDistribution: StatusDistributionPoint[];
  pendingReviewAging: AgingBucket[];
  dateCard: DateCard;
  workingOn: WorkingQueueItem[];
  cityAipStatus: {
    hasCityAipForYear: boolean;
    warningTitle: string;
    warningMessage: string;
    ctaHref: string;
  };
  publicationTimeline: PublicationTimelinePoint[];
  cityAipsByYear: CityAipSummary[];
  engagementPulse: EngagementPulse;
  recentComments: RecentComment[];
  budgetBreakdown: BudgetBreakdown;
  topFundedProjects: TopFundedProject[];
  recentProjectUpdates: ProjectUpdateItem[];
  recentActivity: ActivityItem[];
};

export type CityDashboardRepo = {
  listAvailableYears: () => Promise<number[]>;
  getDashboard: (filters: CityDashboardFilters) => Promise<CityDashboardData>;
};
