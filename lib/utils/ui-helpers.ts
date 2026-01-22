/**
 * UI helper utilities for consistent styling and behavior
 */

import type { ProjectStatus, AipStatus } from "@/types";

/**
 * Get the appropriate CSS classes for a status badge
 * @param status - The status to style
 * @returns Tailwind CSS classes for the badge
 */
export function getProjectStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case "Ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Planning":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Completed":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "On Hold":
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
    case "Published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "For Revision":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Under Review":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Draft":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
