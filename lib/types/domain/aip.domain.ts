import type { AipStatus } from "@/lib/contracts/databasev2";
import type { LguScopeKind } from "@/lib/auth/scope";

export type { AipStatus } from "@/lib/contracts/databasev2";

export type LguScope = LguScopeKind;

export type AipHeader = {
  id: string;
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
export type reviewStatus = ReviewStatus;
export type ProjectKind = "health" | "infrastructure";

export type AipProjectRow = {
  id: string;
  aipId: string;
  projectRefCode: string;
  kind: ProjectKind;
  sector: Sector;
  amount: number;
  reviewStatus: ReviewStatus;
  aipDescription: string;
  implementingOffice?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
  expectedOutputs?: string | null;
  fundingSource?: string | null;
  psBudget?: number | null;
  mooeBudget?: number | null;
  coBudget?: number | null;
  climateChangeAdaptation?: string | null;
  climateChangeMitigation?: string | null;
  ccTypologyCode?: string | null;
  rmObjectiveCode?: string | null;
  aiIssues?: string[];
  officialComment?: string;
};

export type AipListItem = AipHeader;
export type AipDetail = AipHeader;
