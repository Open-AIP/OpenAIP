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
  resolution?: "disputed" | "confirmed" | "comment_only";
};

export type CreateMockAipRepoOptions = {
  defaultScope?: LguScope;
};
