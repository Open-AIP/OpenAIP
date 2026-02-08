import type { AuditRepo, ActivityLogRow } from "./repo";
import { ACTIVITY_LOG_FIXTURE } from "@/lib/fixtures/audit/activity-log.fixture";

function sortNewestFirst(rows: ActivityLogRow[]): ActivityLogRow[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// [DATAFLOW] Mock `AuditRepo` adapter backed by `ACTIVITY_LOG_FIXTURE`.
export function createMockAuditRepo(): AuditRepo {
  return {
    async listMyActivity(actorId: string) {
      return sortNewestFirst(
        ACTIVITY_LOG_FIXTURE.filter((row) => row.actorId === actorId)
      );
    },
    async listAllActivity() {
      return sortNewestFirst(ACTIVITY_LOG_FIXTURE);
    },
  };
}

