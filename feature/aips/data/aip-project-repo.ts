import type { AipProjectRow } from "@/feature/aips/types";

export type SubmitReviewInput = {
  projectId: string;
  aipId: string;
  comment: string;
  // whether the official is disputing/confirming AI issues (semantic)
  resolution?: "disputed" | "confirmed" | "comment_only";
};

export interface AipProjectRepo {
  listByAip(aipId: string): Promise<AipProjectRow[]>;
  submitReview(input: SubmitReviewInput): Promise<void>;
}
