import type { AipStatus } from "@/lib/contracts/databasev2";

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
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700 border-green-200";
    case "under_review":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "for_revision":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "pending_review":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "draft":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
