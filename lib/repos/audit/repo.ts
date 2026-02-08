import type { AipScopeRef, ISODateTime, Json, RoleType, UUID } from "@/lib/contracts/databasev2";

export type ActivityLogEntityType =
  | "aip"
  | "project"
  | "feedback"
  | "upload"
  | (string & {});

export type ActivityLogAction =
  | "draft_created"
  | "submission_created"
  | "revision_uploaded"
  | "cancelled"
  | "project_updated"
  | "comment_replied"
  | "approval_granted"
  | "revision_requested"
  | "published"
  | (string & {});

export type ActivityScopeSnapshot =
  | {
      scope_type: "none";
      barangay_id: null;
      city_id: null;
      municipality_id: null;
    }
  | AipScopeRef;

export type ActivityLogRow = {
  id: UUID;
  actorId: UUID;
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId: UUID;
  scope?: ActivityScopeSnapshot | null;
  metadata?: Json | null;
  actorRole?: RoleType | null;
  createdAt: ISODateTime;
};

// [DATAFLOW] Page/service depends on this interface; swap adapters without touching UI/pages.
// [DBV2] Backing table is `public.activity_log` (server-only writes; RLS restricts reads).
export interface AuditRepo {
  listMyActivity(actorId: string): Promise<ActivityLogRow[]>;
  listAllActivity(): Promise<ActivityLogRow[]>;
}

