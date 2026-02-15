import type { ActivityLogRow, FeedbackRow, ProfileRow } from "@/lib/contracts/databasev2";

export type RateLimitSettingRecord = ActivityLogRow;
export type UserRestrictionRecord = ActivityLogRow;
export type UserFlagRecord = ActivityLogRow;
export type AuditLogRecord = ActivityLogRow;
export type ProfileRecord = ProfileRow;
export type FeedbackRecord = FeedbackRow;

export type RateLimitSettingsVM = {
  maxComments: number;
  timeWindow: "hour" | "day";
  updatedAt: string;
  updatedBy?: string | null;
};

export type ChatbotMetrics = {
  totalRequests: number;
  errorRate: number;
  avgDailyRequests: number;
  periodDays: number;
  trendTotalRequestsPct: number;
  trendErrorRatePct: number;
  trendAvgDailyPct: number;
};

export type ChatbotRateLimitPolicy = {
  maxRequests: number;
  timeWindow: "per_hour" | "per_day";
  updatedAt: string;
  updatedBy?: string | null;
};

export type ChatbotSystemPolicy = {
  isEnabled: boolean;
  retentionDays: number;
  userDisclaimer: string;
  updatedAt: string;
  updatedBy?: string | null;
};

export type FlaggedUserRowVM = {
  userId: string;
  name: string;
  accountType: string;
  reasonSummary: string;
  flags: number;
  lastFlagged: string;
  status: "Active" | "Blocked";
  blockedUntil?: string | null;
};

export type AuditEntryVM = {
  id: string;
  title: string;
  timestamp: string;
  performedBy: string;
  violationCategory?: string | null;
  details?: string | null;
  status?: string | null;
};

export type PlatformControlsDataset = {
  profiles: ProfileRecord[];
  feedback: FeedbackRecord[];
  activity: ActivityLogRow[];
};

export type UsageControlsRepo = {
  getRateLimitSettings: () => Promise<RateLimitSettingsVM>;
  updateRateLimitSettings: (input: {
    maxComments: number;
    timeWindow: "hour" | "day";
  }) => Promise<RateLimitSettingsVM>;
  getChatbotMetrics: () => Promise<ChatbotMetrics>;
  getChatbotRateLimitPolicy: () => Promise<ChatbotRateLimitPolicy>;
  updateChatbotRateLimitPolicy: (input: {
    maxRequests: number;
    timeWindow: "per_hour" | "per_day";
  }) => Promise<ChatbotRateLimitPolicy>;
  getChatbotSystemPolicy: () => Promise<ChatbotSystemPolicy>;
  updateChatbotSystemPolicy: (input: {
    isEnabled: boolean;
    retentionDays: number;
    userDisclaimer: string;
  }) => Promise<ChatbotSystemPolicy>;
  listFlaggedUsers: () => Promise<FlaggedUserRowVM[]>;
  getUserAuditHistory: (userId: string) => Promise<AuditEntryVM[]>;
  temporarilyBlockUser: (input: {
    userId: string;
    reason: string;
    durationValue: number;
    durationUnit: "days" | "weeks";
  }) => Promise<void>;
  unblockUser: (input: { userId: string; reason: string }) => Promise<void>;
};
