import type { AipStatus } from "@/lib/contracts/databasev2";
import { getAipStatusBadgeClass as getCanonicalAipStatusBadgeClass } from "@/lib/ui/status";

export function getAipStatusLabel(status: AipStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_review":
      return "Pending Review";
    case "under_review":
      return "Under Review";
    case "for_revision":
      return "For Revision";
    case "published":
      return "Published";
    default:
      return status;
  }
}

export function getAipStatusBadgeClass(status: AipStatus): string {
  return getCanonicalAipStatusBadgeClass(status);
}
