import type { ActivityLogRow, ChatMessageRow, Json } from "@/lib/contracts/databasev2";
import type {
  FeedbackRecord,
  FlaggedUserRowVM,
  ProfileRecord,
  RateLimitSettingsVM,
  AuditEntryVM,
  ChatbotMetrics,
  ChatbotRateLimitPolicy,
  ChatbotSystemPolicy,
} from "@/lib/repos/usage-controls/types";

const getMetadataString = (metadata: Json, key: string): string | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
};

const getMetadataNumber = (metadata: Json, key: string): number | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
};

const formatShortDate = (iso: string) => iso.slice(0, 10);

const formatAccountType = (role: string | null | undefined) => {
  if (!role) return "User";
  if (role.includes("official")) return "Official";
  if (role === "citizen") return "Citizen";
  if (role === "admin") return "Admin";
  return "User";
};

const getLatestLog = (logs: ActivityLogRow[]) =>
  logs
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ??
  null;

export function deriveRateLimitSettings(activity: ActivityLogRow[]): RateLimitSettingsVM {
  const latest = getLatestLog(activity.filter((log) => log.action === "comment_rate_limit_updated"));

  const maxComments =
    (latest ? getMetadataNumber(latest.metadata, "max_comments") : null) ?? 5;
  const timeWindow =
    (latest ? getMetadataString(latest.metadata, "time_window") : null) === "day"
      ? "day"
      : "hour";

  return {
    maxComments,
    timeWindow,
    updatedAt: latest?.created_at ?? new Date().toISOString(),
    updatedBy: latest ? getMetadataString(latest.metadata, "actor_name") : null,
  };
}

export function mapFlaggedUsers(input: {
  profiles: ProfileRecord[];
  feedback: FeedbackRecord[];
  activity: ActivityLogRow[];
}): FlaggedUserRowVM[] {
  const feedbackById = new Map(input.feedback.map((row) => [row.id, row]));
  const hiddenLogs = input.activity.filter((log) => log.action === "feedback_hidden");

  const flagCountByUser = new Map<string, number>();
  const lastHiddenByUser = new Map<string, ActivityLogRow>();

  hiddenLogs.forEach((log) => {
    if (!log.entity_id) return;
    const feedback = feedbackById.get(log.entity_id);
    const authorId = feedback?.author_id;
    if (!authorId) return;

    flagCountByUser.set(authorId, (flagCountByUser.get(authorId) ?? 0) + 1);

    const currentLast = lastHiddenByUser.get(authorId);
    if (!currentLast || currentLast.created_at < log.created_at) {
      lastHiddenByUser.set(authorId, log);
    }
  });

  const userActions = input.activity.filter(
    (log) => log.entity_table === "profiles" && log.entity_id
  );

  return input.profiles
    .map((profile) => {
      const flags = flagCountByUser.get(profile.id) ?? 0;
      const lastHidden = lastHiddenByUser.get(profile.id);
      const defaultReason = "Policy violation";

      const userLogs = userActions.filter((log) => log.entity_id === profile.id);
      const latestUserLog = getLatestLog(
        userLogs.filter((log) => log.action === "user_blocked" || log.action === "user_unblocked")
      );

      const isBlocked = latestUserLog?.action === "user_blocked";
      const blockReason = isBlocked
        ? getMetadataString(latestUserLog?.metadata, "reason")
        : null;
      const blockedUntil = isBlocked
        ? getMetadataString(latestUserLog?.metadata, "blocked_until")
        : null;

      const reasonSummary =
        (lastHidden ? getMetadataString(lastHidden.metadata, "reason") : null) ??
        blockReason ??
        defaultReason;

      return {
        userId: profile.id,
        name: profile.full_name ?? "Unknown User",
        accountType: formatAccountType(profile.role),
        reasonSummary,
        flags,
        lastFlagged: lastHidden
          ? formatShortDate(lastHidden.created_at)
          : latestUserLog
            ? formatShortDate(latestUserLog.created_at)
            : "-",
        status: isBlocked ? "Blocked" : "Active",
        blockedUntil,
      } satisfies FlaggedUserRowVM;
    })
    .filter((row) => row.flags > 0 || row.status === "Blocked")
    .sort((a, b) => b.flags - a.flags);
}

const getAuditTitle = (action: string) => {
  switch (action) {
    case "feedback_hidden":
      return "Feedback Marked as Hidden";
    case "feedback_unhidden":
      return "Feedback Restored";
    case "user_blocked":
      return "Account Temporarily Blocked";
    case "user_unblocked":
      return "Account Unblocked";
    case "comment_rate_limit_updated":
      return "Comment Rate Limit Updated";
    default:
      return action;
  }
};

export function mapUserAuditHistory(input: {
  userId: string;
  feedback: FeedbackRecord[];
  activity: ActivityLogRow[];
}): AuditEntryVM[] {
  const feedbackById = new Map(input.feedback.map((row) => [row.id, row]));

  const relevantLogs = input.activity.filter((log) => {
    if (log.action === "feedback_hidden" || log.action === "feedback_unhidden") {
      if (!log.entity_id) return false;
      const feedback = feedbackById.get(log.entity_id);
      return feedback?.author_id === input.userId;
    }

    if (log.action === "user_blocked" || log.action === "user_unblocked") {
      return log.entity_id === input.userId;
    }

    return false;
  });

  return relevantLogs
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((log) => ({
      id: log.id,
      title: getAuditTitle(log.action),
      timestamp: log.created_at,
      performedBy:
        getMetadataString(log.metadata, "actor_name") ??
        (log.actor_id ? `User ${log.actor_id}` : "System"),
      violationCategory: getMetadataString(log.metadata, "violation_category"),
      details: getMetadataString(log.metadata, "reason") ?? getMetadataString(log.metadata, "details"),
      status:
        log.action === "feedback_hidden"
          ? "Hidden"
          : log.action === "feedback_unhidden"
            ? "Visible"
            : log.action === "user_blocked"
              ? "Blocked"
              : log.action === "user_unblocked"
                ? "Active"
                : null,
    }));
}

export function deriveChatbotRateLimitPolicy(
  activity: ActivityLogRow[]
): ChatbotRateLimitPolicy {
  const latest = getLatestLog(
    activity.filter((log) => log.action === "chatbot_rate_limit_updated")
  );

  const maxRequests =
    (latest ? getMetadataNumber(latest.metadata, "max_requests") : null) ?? 20;
  const rawWindow = latest ? getMetadataString(latest.metadata, "time_window") : null;
  const timeWindow = rawWindow === "per_day" ? "per_day" : "per_hour";

  return {
    maxRequests,
    timeWindow,
    updatedAt: latest?.created_at ?? new Date().toISOString(),
    updatedBy: latest ? getMetadataString(latest.metadata, "actor_name") : null,
  };
}

export function deriveChatbotSystemPolicy(
  activity: ActivityLogRow[]
): ChatbotSystemPolicy {
  const latest = getLatestLog(
    activity.filter((log) => log.action === "chatbot_policy_updated")
  );

  const isEnabled =
    (latest
      ? (latest.metadata as Record<string, unknown>)?.is_enabled
      : null) === false
      ? false
      : true;

  const retentionDays =
    (latest ? getMetadataNumber(latest.metadata, "retention_days") : null) ?? 90;

  const userDisclaimer =
    (latest ? getMetadataString(latest.metadata, "user_disclaimer") : null) ??
    "This disclaimer will be shown to users before they interact with the chatbot.";

  return {
    isEnabled,
    retentionDays,
    userDisclaimer,
    updatedAt: latest?.created_at ?? new Date().toISOString(),
    updatedBy: latest ? getMetadataString(latest.metadata, "actor_name") : null,
  };
}

export function deriveChatbotMetrics(
  messages: ChatMessageRow[],
  periodDays = 14
): ChatbotMetrics {
  const totalRequests = messages.length;
  const errorCount = messages.filter((message) => {
    if (!message.retrieval_meta || typeof message.retrieval_meta !== "object") return false;
    return Boolean((message.retrieval_meta as Record<string, unknown>)?.is_error);
  }).length;

  const errorRate = totalRequests === 0 ? 0 : errorCount / totalRequests;
  const avgDailyRequests = periodDays > 0 ? totalRequests / periodDays : totalRequests;

  return {
    totalRequests,
    errorRate,
    avgDailyRequests,
    periodDays,
    trendTotalRequestsPct: 12.3,
    trendErrorRatePct: -0.4,
    trendAvgDailyPct: 8.1,
  };
}
