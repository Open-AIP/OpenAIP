import type { AipStatus } from "@/lib/contracts/databasev2/enums";

export const AIP_STATUS_BADGE_CLASS: Record<AipStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  for_revision: "bg-amber-50 text-amber-800 border-amber-200",
  under_review: "bg-sky-50 text-sky-700 border-sky-200",
  pending_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
  draft: "bg-slate-50 text-slate-700 border-slate-200",
};

export const ADMIN_ACTIVITY_TONE_STYLES: Record<"info" | "warning" | "danger" | "success", string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const CITY_AIP_COVERAGE_TONE_STYLES: Record<"missing" | "available", string> = {
  missing: "border-rose-200 bg-white text-rose-600",
  available: "border-emerald-200 bg-white text-emerald-700",
};

export function getAipStatusBadgeClass(status: AipStatus): string {
  return AIP_STATUS_BADGE_CLASS[status] ?? AIP_STATUS_BADGE_CLASS.draft;
}
