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

export type reviewStatus = "ai_flagged" | "reviewed" | "unreviewed";
export type ProjectKind = "health" | "infrastructure";

/**
 * One row inside the AIP extracted table.
 * Connects to a project via projectRefCode.
 */
export type AipProjectRow = {
  id: string; // row id
  aipId: string; // fk → AipHeader.id
  projectRefCode: string; // fk → ProjectMaster.projectRefCode
  kind: ProjectKind;

  sector: Sector;
  amount: number;
  reviewStatus: reviewStatus;

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

// [DATAFLOW] UI/pages should depend on this interface, not on a concrete adapter.
// [DBV2] Backing table is `public.aips` (enum `public.aip_status`).
export interface AipRepo {
  listVisibleAips(
    input: ListVisibleAipsInput,
    actor?: import("@/lib/domain/actor-context").ActorContext
  ): Promise<AipListItem[]>;
  getAipDetail(
    aipId: string,
    actor?: import("@/lib/domain/actor-context").ActorContext
  ): Promise<AipDetail | null>;
  updateAipStatus(
    aipId: string,
    next: AipStatus,
    actor?: import("@/lib/domain/actor-context").ActorContext
  ): Promise<void>;
}

export type SubmitReviewInput = {
  projectId: string;
  aipId: string;
  comment: string;
  resolution?: "disputed" | "confirmed" | "comment_only";
};

// [DATAFLOW] Used by AIP detail views to list rows/projects under an AIP and submit review notes.
export interface AipProjectRepo {
  listByAip(aipId: string): Promise<AipProjectRow[]>;
  submitReview(input: SubmitReviewInput): Promise<void>;
}

