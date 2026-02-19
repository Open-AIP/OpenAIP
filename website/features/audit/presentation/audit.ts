export function getAuditActionLabel(action: string): string {
  switch (action) {
    case "draft_created":
      return "Draft Creation";
    case "submission_created":
      return "Submission";
    case "revision_uploaded":
      return "Revision Upload";
    case "cancelled":
      return "Cancellation";
    case "project_updated":
      return "Project Update";
    case "comment_replied":
      return "Comment Reply";
    case "approval_granted":
      return "Approval";
    case "revision_requested":
      return "Revision Requested";
    case "published":
      return "Publish";
    default:
      return action;
  }
}

export function getAuditEntityLabel(entityType: string): string {
  switch (entityType) {
    case "aip":
      return "AIP";
    case "project":
      return "Project";
    case "feedback":
      return "Feedback";
    case "upload":
      return "Upload";
    default:
      return entityType;
  }
}

export function getAuditRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "city_official":
      return "City Official";
    case "municipal_official":
      return "Municipal Official";
    case "barangay_official":
      return "Barangay Official";
    case "citizen":
      return "Citizen";
    default:
      return "Unknown";
  }
}
