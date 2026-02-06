/**
 * UI helper utilities for consistent styling and behavior
 */
import type { AipStatus } from "@/lib/contracts/databasev2";
import type { ProjectStatus } from "@/features/projects/types";

/**
 * Get the appropriate CSS classes for a status badge
 * @param status - The status to style
 * @returns Tailwind CSS classes for the badge
 */
export function getProjectStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case "ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "planning":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "completed":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "on_hold":
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

/**
 * Get the appropriate CSS classes for an AIP status badge
 * @param status - The AIP status to style
 * @returns Tailwind CSS classes for the badge
 */
export function getAipStatusBadgeClass(status: AipStatus): string {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "for_revision":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "under_review":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "draft":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}


export function getStatusBadgeVariant(status: AipStatus): string {
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
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function formatTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
