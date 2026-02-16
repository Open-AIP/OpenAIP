import type { AipStatus, ProjectCategory, RoleType } from "@/lib/contracts/databasev2/enums";
import type { ProjectStatus } from "@/lib/repos/projects/types";

export type BarangayProjectSector = "General" | "Social" | "Economic" | "Other";

export type BarangayDashboardFilters = {
  year: number;
  search: string;
  sector: "all" | BarangayProjectSector;
  projectType: "all" | ProjectCategory;
};

export type BudgetBreakdownPoint = {
  id: string;
  label: BarangayProjectSector;
  percent: number;
  amount: number;
  colorClass: string;
};

export type DashboardDateCard = {
  day: string;
  weekday: string;
  month: string;
  year: number;
};

export type WorkingOnItem = {
  id: string;
  title: string;
  href: string;
};

export type TopFundedProjectRow = {
  id: string;
  rank: number;
  projectName: string;
  sector: BarangayProjectSector;
  projectType: ProjectCategory;
  budget: number;
  // TODO(DB): map to DBv2 lifecycle field once `public.projects` has an explicit status enum.
  projectStatus: ProjectStatus;
};

export type RecentProjectUpdate = {
  id: string;
  title: string;
  category: ProjectCategory;
  date: string;
  attendees: number;
};

export type PublicationTimelinePoint = {
  year: number;
  publishedCount: number;
};

export type CityAipYearRow = {
  id: string;
  year: number;
  status: AipStatus;
  uploadedBy: string;
  uploadDate: string;
  actionHref: string;
};

export type ActivityFeedItem = {
  id: string;
  action: string;
  timestamp: string;
  tag: "AIP" | "Project" | "Comment";
};

export type TrendPoint = {
  label: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  value: number;
};

export type FeedbackTargetPoint = {
  label: "City AIPs" | "Health Projects" | "Infrastructure Projects";
  count: number;
};

export type RecentFeedbackItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
};

export type BarangayDashboardData = {
  scope: {
    role: RoleType;
    barangayId: string;
    barangayName: string;
    cityId: string;
    cityName: string;
  };
  selectedYear: number;
  availableYears: number[];
  globalSearchPlaceholder: string;
  aipStatus: {
    status: AipStatus;
    asOfLabel: string;
    lastUpdatedLabel: string;
  };
  totalProjects: {
    total: number;
    healthCount: number;
    infrastructureCount: number;
  };
  budgetBreakdown: BudgetBreakdownPoint[];
  citizenFeedback: {
    totalComments: number;
    awaitingReply: number;
    hidden: number;
    // TODO(DB): `visible/hidden/flagged` moderation statuses are UI metrics until DBv2 moderation fields are finalized.
    actionRequiredLabel: string;
  };
  dateCard: DashboardDateCard;
  workingOn: {
    isCaughtUp: boolean;
    items: WorkingOnItem[];
    emptyLabel: string;
  };
  budgetActions: {
    aipDetailsHref: string;
    allProjectsHref?: string;
  };
  topFundedProjects: TopFundedProjectRow[];
  recentProjectUpdates: RecentProjectUpdate[];
  cityAipStatus: {
    hasCityAipForYear: boolean;
    title: string;
    description: string;
    ctaHref: string;
  };
  publicationTimeline: PublicationTimelinePoint[];
  cityAipsByYear: CityAipYearRow[];
  recentActivity: ActivityFeedItem[];
  engagementPulse: {
    newThisWeek: number;
    awaitingReply: number;
    hidden: number;
    feedbackTrend: TrendPoint[];
    feedbackTargets: FeedbackTargetPoint[];
  };
  recentFeedback: RecentFeedbackItem[];
};

export type BarangayDashboardRepo = {
  listAvailableYears: () => Promise<number[]>;
  getDashboard: (filters: BarangayDashboardFilters) => Promise<BarangayDashboardData>;
};
