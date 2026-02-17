import type { ActivityLogRow } from "@/lib/repos/audit/types";
import type { RoleType } from "@/lib/contracts/databasev2";
import type { AuditLogRecord } from "@/lib/types/domain/audit.domain";

export function mapAuditRecordToActivityLogRow(
  record: AuditLogRecord
): ActivityLogRow {
  let scope: ActivityLogRow["scope"];

  if (record.barangay_id) {
    scope = {
      scope_type: "barangay",
      barangay_id: record.barangay_id,
      city_id: null,
      municipality_id: null,
    };
  } else if (record.city_id) {
    scope = {
      scope_type: "city",
      barangay_id: null,
      city_id: record.city_id,
      municipality_id: null,
    };
  } else if (record.municipality_id) {
    scope = {
      scope_type: "municipality",
      barangay_id: null,
      city_id: null,
      municipality_id: record.municipality_id,
    };
  } else {
    scope = {
      scope_type: "none",
      barangay_id: null,
      city_id: null,
      municipality_id: null,
    };
  }

  const normalizeRole = (value: string | null): RoleType | null => {
    if (!value) return null;
    const allowed: RoleType[] = [
      "citizen",
      "barangay_official",
      "city_official",
      "municipal_official",
      "admin",
    ];
    return allowed.includes(value as RoleType) ? (value as RoleType) : null;
  };

  return {
    id: record.id,
    actorId: record.actor_id ?? "unknown",
    action: record.action,
    entityType: record.entity_table ?? "unknown",
    entityId: record.entity_id ?? "unknown",
    scope,
    metadata: record.metadata,
    actorRole: normalizeRole(record.actor_role),
    createdAt: record.created_at,
  };
}

export function getAuditActionLabel(action: string): string {
  switch (action) {
    case "draft_created":
      return "Draft Creation";
    case "submission_created":
      return "Submission";
    case "revision_uploaded":
      return "Revision Upload";
    case "cancelled":
      return "Cancellation";
    case "project_updated":
      return "Project Update";
    case "comment_replied":
      return "Comment Reply";
    case "approval_granted":
      return "Approval";
    case "revision_requested":
      return "Revision Requested";
    case "published":
      return "Publish";
    default:
      return action;
  }
}

export function getAuditEntityLabel(entityType: string): string {
  switch (entityType) {
    case "aip":
      return "AIP";
    case "project":
      return "Project";
    case "feedback":
      return "Feedback";
    case "upload":
      return "Upload";
    default:
      return entityType;
  }
}

export function getAuditRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "city_official":
      return "City Official";
    case "municipal_official":
      return "Municipal Official";
    case "barangay_official":
      return "Barangay Official";
    case "citizen":
      return "Citizen";
    default:
      return "Unknown";
  }
}
