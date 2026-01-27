export type ReviewStatus = "ai_flagged" | "reviewed" | "clean";

export type Sector =
  | "General Sector"
  | "Social Sector"
  | "Economic Sector"
  | "Other Services"
  | "Unknown";

export interface AipProjectRow {
  id: string;              // stable UUID (Supabase row id)
  aipId: string;           // parent AIP id (Supabase FK)
  refCode: string;         // e.g., "GS-2026-002"
  description: string;     // program_project_description
  amount: number;          // total_amount

  // Derived (do not store unless you want)
  sector: Sector;

  reviewStatus: ReviewStatus;

  // AI findings (stored in DB or computed)
  aiIssues: string[];

  // latest official comment (optional)
  officialComment?: string;

  // auditing
  updatedAt?: string;
}
