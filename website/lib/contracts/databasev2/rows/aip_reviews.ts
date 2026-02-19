import type { ReviewAction } from "../enums";
import type { ISODateTime, UUID } from "../primitives";

export type AipReviewRow = {
  id: UUID;
  aip_id: UUID;
  action: ReviewAction;
  note: string | null;
  reviewer_id: UUID;
  created_at: ISODateTime;
};

