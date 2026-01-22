import type { AipStatus } from "@/types";

// Re-export formatting utility from shared location
export { formatPeso as peso } from "@/lib/utils/formatting";

/**
 * Editing rules (adjust to your workflow):
 * - Typically editable in Draft / For Revision
 * - Locked in Under Review / Pending Review / Published
 */
export function canEditAip(status: AipStatus) {
  return status === "Draft" || status === "For Revision";
}

export function editLockedMessage(status: AipStatus) {
  if (status === "Under Review") {
    return "Editing is not allowed while the AIP is pending review. Please wait for the review process to complete.";
  }
  if (status === "Published") {
    return "Editing is not allowed for a published AIP.";
  }
  return "Editing is currently disabled.";
}
