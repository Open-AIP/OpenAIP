import type { AipHeader } from "@/features/aip/types";
import type { AipStatus } from "@/lib/contracts/databasev2";
import type { ActorContext } from "@/lib/domain/actor-context";
import type {
  CityReviewFilters,
  LatestReview,
  ListSubmissionsResult,
} from "./submissionsReview.contracts";

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

