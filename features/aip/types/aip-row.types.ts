export type Sector = "General Sector"|  "Social Sector"|  "Economic Sector"|  "Other Services" | "Unknown";
export type reviewStatus = "ai_flagged" | "reviewed" | "unreviewed";
export type ProjectKind = "health" | "infrastructure";

/**
 * One row inside the AIP extracted table.
 * Connects to a project via projectRefCode.
 */
export type AipProjectRow = {
  id: string;               // row id
  aipId: string;            // fk → AipHeader.id
  projectRefCode: string;   // fk → ProjectMaster.projectRefCode
  kind: ProjectKind;

  sector: Sector;
  amount: number;
  reviewStatus: reviewStatus; // required property

  // What AIP extraction says for the row
  aipDescription: string;
  
  // AI-detected issues (for ai_flagged status)
  aiIssues?: string[];
  
  // Official comment from reviewer
  officialComment?: string;
};
