import type { ISODateTime, UUID } from "../primitives";

export type ProvinceRow = {
  id: UUID;
  region_id: UUID;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: ISODateTime;
};

