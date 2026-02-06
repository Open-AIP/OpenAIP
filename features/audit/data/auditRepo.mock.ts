import type { AuditRepo } from "./AuditRepo";
import type { ActivityLogRow } from "../types/audit.types";
import { ACTIVITY_LOG_MOCK } from "../mock/activity-log.mock";

function sortNewestFirst(rows: ActivityLogRow[]): ActivityLogRow[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// [DATAFLOW] Mock `AuditRepo` adapter backed by a local table (`ACTIVITY_LOG_MOCK`).
// [SUPABASE-SWAP] Replace with a Supabase adapter querying `public.activity_log` (read-only from the UI).
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
