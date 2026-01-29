/**
 * AIP Utilities
 * 
 * Helper functions and utilities for AIP (Annual Investment Plan) management.
 * Provides status-based editing permissions and messaging.
 * 
 * @module feature/aips/utils
 */

import type { AipStatus } from "@/types";
import { Sector } from "./types";

// Re-export formatting utility from shared location
export { formatPeso as peso } from "@/lib/utils/formatting";

/**
 * Determines if an AIP can be edited based on its current status
 * 
 * Editing rules:
 * - Editable: Draft, For Revision
 * - Locked: Under Review, Pending Review, Published
 * 
 * @param status - The current AIP status
 * @returns true if the AIP can be edited, false otherwise
 */
export function canEditAip(status: AipStatus) {
  return status === "Draft" || status === "For Revision";
}

/**
 * Returns an appropriate message explaining why editing is locked
 * 
 * @param status - The current AIP status
 * @returns User-friendly message explaining the edit restriction
 */
export function editLockedMessage(status: AipStatus) {
  if (status === "Under Review") {
    return "Editing is not allowed while the AIP is pending review. Please wait for the review process to complete.";
  }
  if (status === "Published") {
    return "Editing is not allowed for a published AIP.";
  }
  return "Editing is currently disabled.";
}








export const SECTOR_TABS: Exclude<Sector, "Unknown">[] = [
  "General Sector",
  "Social Sector",
  "Economic Sector",
  "Other Services",
];

export function sectorFromRefCode(refCode: string): Sector {
  const prefix = refCode.trim().toLowerCase();

  if (prefix.startsWith("gs")) return "General Sector";
  if (prefix.startsWith("ss")) return "Social Sector";
  if (prefix.startsWith("es")) return "Economic Sector";
  if (prefix.startsWith("os")) return "Other Services";

  return "Unknown";
}
