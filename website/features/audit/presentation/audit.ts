export function getAuditActionLabel(action: string): string {
  switch (action) {
    case "aip_created":
      return "AIP Record Created";
    case "aip_updated":
      return "AIP Record Updated";
    case "aip_deleted":
      return "AIP Record Deleted";
    case "project_record_created":
      return "Project Record Created";
    case "project_record_updated":
      return "Project Record Updated";
    case "project_record_deleted":
      return "Project Record Deleted";
    case "feedback_created":
      return "Feedback Created";
    case "feedback_updated":
      return "Feedback Updated";
    case "feedback_deleted":
      return "Feedback Deleted";
    case "draft_created":
      return "Draft Creation";
    case "submission_created":
      return "Submission";
    case "revision_uploaded":
      return "Revision Upload";
    case "cancelled":
      return "Cancellation";
    case "draft_deleted":
      return "Draft Deletion";
    case "project_updated":
      return "Project Update";
    case "project_info_updated":
      return "Project Information Update";
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
    case "aips":
      return "AIP";
    case "project":
    case "projects":
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
