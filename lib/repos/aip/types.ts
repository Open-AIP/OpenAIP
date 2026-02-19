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

export type SubmitReviewProjectUpdates = {
  projectRefCode: string;
  aipDescription: string;
  implementingOffice: string | null;
  startDate: string | null;
  completionDate: string | null;
  expectedOutputs: string | null;
  fundingSource: string | null;
  psBudget: number | null;
  mooeBudget: number | null;
  coBudget: number | null;
  amount: number;
  climateChangeAdaptation: string | null;
  climateChangeMitigation: string | null;
  ccTypologyCode: string | null;
  rmObjectiveCode: string | null;
  sector: AipProjectRow["sector"];
};

export type SubmitReviewInput = {
  projectId: string;
  aipId: string;
  comment: string;
  projectUpdates: SubmitReviewProjectUpdates;
};

export type CreateMockAipRepoOptions = {
  defaultScope?: LguScope;
};
