import type { AipStatus, ISODateTime, ReviewAction, UUID } from "@/lib/contracts/databasev2";
import type { ActorContext } from "@/lib/domain/actor-context";
import type { AipHeader } from "@/lib/repos/aip/repo";

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

export type ListSubmissionsForCityParams = {
  cityId: string;
  filters?: CityReviewFilters;
  actor: ActorContext | null;
};

export type GetSubmissionAipDetailParams = {
  aipId: string;
  actor: ActorContext | null;
};

export type StartReviewIfNeededParams = {
  aipId: string;
  actor: ActorContext | null;
};

export type RequestRevisionParams = {
  aipId: string;
  note: string;
  actor: ActorContext | null;
};

export type PublishAipParams = {
  aipId: string;
  note?: string;
  actor: ActorContext | null;
};

export type GetLatestReviewParams = {
  aipId: string;
};

// [DATAFLOW] Server actions/services depend on this contract; adapters implement DBV2 review + status transitions.
// [DBV2] Backing tables are `public.aips` (status) + `public.aip_reviews` (append-only reviewer log).
// [SECURITY] Reviewer actions are jurisdiction-gated (city/municipal) and require AIP non-draft; DBV2 allows reviewers to update barangay AIPs under scope.
// [SUPABASE-SWAP] Supabase adapter should update `public.aips.status` + insert into `public.aip_reviews`, relying on RLS policies for enforcement.
export type AipSubmissionsReviewRepo = {
  listSubmissionsForCity: (
    params: ListSubmissionsForCityParams
  ) => Promise<ListSubmissionsResult>;
  getSubmissionAipDetail: (
    params: GetSubmissionAipDetailParams
  ) => Promise<{ aip: AipHeader; latestReview: LatestReview } | null>;
  startReviewIfNeeded: (params: StartReviewIfNeededParams) => Promise<AipStatus>;
  requestRevision: (params: RequestRevisionParams) => Promise<AipStatus>;
  publishAip: (params: PublishAipParams) => Promise<AipStatus>;
  getLatestReview: (params: GetLatestReviewParams) => Promise<LatestReview>;
};
