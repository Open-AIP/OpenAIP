import type { AipStatus } from "@/types";

export function peso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

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
