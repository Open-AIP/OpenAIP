import type { AipStatus, ISODateTime, ReviewAction, UUID } from "@/lib/contracts/databasev2";

export type { AipStatus } from "@/lib/contracts/databasev2";

export type AipSubmissionRow = {
  id: UUID;
  title: string;
  year: number;
  status: AipStatus;
  scope: "barangay" | "city" | "municipality";
  barangayName?: string | null;
  uploadedAt: ISODateTime;
  reviewerName?: string | null;
};

export type AipReviewCounts = {
  total: number;
  published: number;
  underReview: number;
  pendingReview: number;
  forRevision: number;
};

export type LatestReview = {
  reviewerId: UUID;
  reviewerName: string;
  action: ReviewAction;
  note: string | null;
  createdAt: ISODateTime;
} | null;
