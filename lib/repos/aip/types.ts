import type { LguScope } from "@/lib/types/domain/aip.domain";

export type {
  AipStatus,
  LguScope,
  AipHeader,
  Sector,
  ReviewStatus,
  reviewStatus,
  ProjectKind,
  AipProjectRow,
  AipListItem,
  AipDetail,
} from "@/lib/types/domain/aip.domain";

export type ListVisibleAipsInput = {
  visibility?: "public" | "my";
  scope?: LguScope;
};

export type SubmitReviewInput = {
  projectId: string;
  aipId: string;
  comment: string;
};

export type CreateMockAipRepoOptions = {
  defaultScope?: LguScope;
};
