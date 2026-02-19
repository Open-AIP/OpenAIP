/**
 * AIP Utilities
 * 
 * Helper functions and utilities for AIP (Annual Investment Plan) management.
 * Provides status-based editing permissions and messaging.
 * 
 * @module feature/aips/utils
 */

import type { AipStatus, Sector } from "./types";

// Re-export formatting utility from shared location
export { formatPeso as peso } from "@/lib/formatting";

/**
 * Determines if an AIP can be edited based on its current status
 * 
 * Editing rules:
 * - Editable: draft, for_revision
 * - Locked: under_review, pending_review, published
 * 
 * @param status - The current AIP status
 * @returns true if the AIP can be edited, false otherwise
 */
export function canEditAip(status: AipStatus) {
  return status === "draft" || status === "for_revision";
}

/**
 * Returns an appropriate message explaining why editing is locked
 * 
 * @param status - The current AIP status
 * @returns User-friendly message explaining the edit restriction
 */
export function editLockedMessage(status: AipStatus) {
  if (status === "pending_review") {
    return "Editing is not allowed while the AIP is pending review. Please wait for the review process to complete.";
  }
  if (status === "under_review") {
    return "Editing is not allowed while the AIP is under review. Please wait for the review process to complete.";
  }
  if (status === "published") {
    return "Editing is not allowed for a published AIP.";
  }
  return "Editing is currently disabled.";
}

/**
 * Get the appropriate CSS classes for an AIP status badge
 * 
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
    case "pending_review":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "draft":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}








export const SECTOR_TABS: Exclude<Sector, "Unknown">[] = [
  "General Sector",
  "Social Sector",
  "Economic Sector",
  "Other Services",
];

/**
 * Extract unique years from AIP records for filtering
 * 
 * @param items - Array of items with year property
 * @returns Sorted array of unique years (descending)
 */
export function getAipYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}
