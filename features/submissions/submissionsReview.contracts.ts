import type { AipStatus, ISODateTime, ReviewAction, UUID } from "@/lib/contracts/databasev2";
import type { ActorContext } from "@/lib/domain/actor-context";

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

export type ListSubmissionsResult = {
  rows: AipSubmissionRow[];
  counts: AipReviewCounts;
};

export type CreateReviewInput = {
  aipId: UUID;
  action: ReviewAction;
  note?: string;
};

export type LatestReview = {
  reviewerId: UUID;
  reviewerName: string;
  action: ReviewAction;
  note: string | null;
  createdAt: ISODateTime;
} | null;

export type CityReviewFilters = {
  year?: number;
  status?: AipStatus;
  barangayName?: string;
};

export type CityListParams = {
  cityId: UUID;
  filters?: CityReviewFilters;
  actor: ActorContext | null;
};

export type AipDetailParams = {
  aipId: UUID;
  actor: ActorContext | null;
};
