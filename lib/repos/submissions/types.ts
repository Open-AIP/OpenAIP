import type { ActorContext } from "@/lib/domain/actor-context";
import type { AipHeader } from "@/lib/repos/aip/repo";

import type { AipStatus, AipReviewCounts, AipSubmissionRow, LatestReview } from "@/lib/types/domain/submissions.domain";

export type { AipStatus, AipSubmissionRow, AipReviewCounts, LatestReview } from "@/lib/types/domain/submissions.domain";

export type ListSubmissionsResult = {
  rows: AipSubmissionRow[];
  counts: AipReviewCounts;
};

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

export type { AipHeader, ActorContext };

