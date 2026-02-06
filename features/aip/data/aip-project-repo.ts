import type { AipProjectRow } from "@/features/aip/types";

export type SubmitReviewInput = {
  projectId: string;
  aipId: string;
  comment: string;
  // whether the official is disputing/confirming AI issues (semantic)
  resolution?: "disputed" | "confirmed" | "comment_only";
};

// [DATAFLOW] Used by AIP detail views to list “rows/projects” under an AIP and submit review notes.
// [DBV2] Canonical storage for projects-under-AIP is `public.projects` (+ detail tables). Review notes should map to `public.feedback`
//        (typically `target_type='aip'`, `kind='lgu_note'`, and `field_key` referencing the row/ref-code).
// [SECURITY] DBV2 reviewers cannot write project-target feedback; reviewer notes should be AIP-target + jurisdiction-gated.
export interface AipProjectRepo {
  listByAip(aipId: string): Promise<AipProjectRow[]>;
  submitReview(input: SubmitReviewInput): Promise<void>;
}
