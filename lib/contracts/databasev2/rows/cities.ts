import type { ISODateTime, UUID } from "../primitives";

export type CityRow = {
  id: UUID;
  region_id: UUID;
  province_id: UUID | null;
  psgc_code: string;
  name: string;
  is_independent: boolean;
  is_active: boolean;
  created_at: ISODateTime;
};

