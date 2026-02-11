import type { AipStatus } from "@/lib/contracts/databasev2";

export type { AipStatus } from "@/lib/contracts/databasev2";

export type LguScope = "barangay" | "city";

export type AipHeader = {
  id: string; // aipId
  scope: LguScope;
  barangayName?: string;

  title: string;
  description: string;
  year: number;
  budget: number;

  uploadedAt: string;
  publishedAt?: string;

  status: AipStatus;

  fileName: string;
  pdfUrl: string;
  tablePreviewUrl?: string;

  summaryText?: string;
  detailedBullets?: string[];

  sectors: string[];

  uploader: {
    name: string;
    role: string;
    uploadDate: string;
    budgetAllocated: number;
  };

  feedback?: string;
};

export type Sector =
  | "General Sector"
  | "Social Sector"
  | "Economic Sector"
  | "Other Services"
  | "Unknown";

export type ReviewStatus = "ai_flagged" | "reviewed" | "unreviewed";
export type ProjectKind = "health" | "infrastructure";

/**
 * One row inside the AIP extracted table.
 * Connects to a project via projectRefCode.
 */
export type AipProjectRow = {
  id: string; // row id
  aipId: string; // fk → AipHeader.id
  projectRefCode: string; // join key → Projects
  kind: ProjectKind;

  sector: Sector;
  amount: number;
  reviewStatus: ReviewStatus;

  aipDescription: string;

  aiIssues?: string[];
  officialComment?: string;
};

export type AipListItem = AipHeader;
export type AipDetail = AipHeader;

export type ListVisibleAipsInput = {
  visibility?: "public" | "my";
  scope?: LguScope;
};

export type SubmitReviewInput = {
  projectId: string;
  aipId: string;
  comment: string;
  resolution?: "disputed" | "confirmed" | "comment_only";
};

export type CreateMockAipRepoOptions = {
  defaultScope?: LguScope;
};

