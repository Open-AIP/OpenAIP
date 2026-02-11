import type { AipStatus } from "../enums";
import type { ISODateTime, UUID } from "../primitives";

export type AipRow = {
  id: UUID;

  fiscal_year: number;

  barangay_id: UUID | null;
  city_id: UUID | null;
  municipality_id: UUID | null;

  status: AipStatus;
  status_updated_at: ISODateTime;
  submitted_at: ISODateTime | null;
  published_at: ISODateTime | null;

  created_by: UUID | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

