import type { AuditRepo } from "./AuditRepo";
import type { ActivityLogRow } from "../types/audit.types";
import { ACTIVITY_LOG_MOCK } from "../mock/activity-log.mock";

function sortNewestFirst(rows: ActivityLogRow[]): ActivityLogRow[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createMockAuditRepo(): AuditRepo {
  return {
    async listMyActivity(actorId: string) {
      return sortNewestFirst(ACTIVITY_LOG_MOCK.filter((row) => row.actorId === actorId));
    },
    async listAllActivity() {
      return sortNewestFirst(ACTIVITY_LOG_MOCK);
    },
  };
}

