import type { ActivityLogRow } from "../types/audit.types";

// [DATAFLOW] `getAuditFeedForActor()` depends on this interface; swap adapters without changing UI/pages.
// [DBV2] Backing table is `public.activity_log` (server-only writes; RLS restricts reads to admin/all vs official/self).
// [SECURITY] UI must never insert directly into `activity_log`; only server/service-role pipelines should write.
export interface AuditRepo {
  listMyActivity(actorId: string): Promise<ActivityLogRow[]>;
  listAllActivity(): Promise<ActivityLogRow[]>;
}
