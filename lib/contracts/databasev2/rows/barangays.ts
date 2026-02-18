import type { ISODateTime, UUID } from "../primitives";

export type BarangayRow = {
  id: UUID;
  city_id: UUID | null;
  municipality_id: UUID | null;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: ISODateTime;
};

