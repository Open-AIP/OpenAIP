import type { ISODateTime, UUID } from "../primitives";

export type MunicipalityRow = {
  id: UUID;
  province_id: UUID;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: ISODateTime;
};

