export type AuditEventType =
  | "Draft Creation"
  | "Submission"
  | "Revision Upload"
  | "Cancellation"
  | "Project Update"
  | "Comment Reply"
  | "Approval"
  | "Revision Requested"
  | "Publish";

export type AuditLog = {
  id: string;
  scope: "barangay" | "city"; // future-proof
  year: number;
  name: string;
  position: string;
  event: AuditEventType;
  dateTimeISO: string; // ISO string for sorting and filtering
  details: string;
};
