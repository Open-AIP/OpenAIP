import type { ActivityLogRow } from "../types/audit.types";

export interface AuditRepo {
  listMyActivity(actorId: string): Promise<ActivityLogRow[]>;
  listAllActivity(): Promise<ActivityLogRow[]>;
}

