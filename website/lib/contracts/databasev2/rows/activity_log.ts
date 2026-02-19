import type { ISODateTime, Json, UUID } from "../primitives";

export type ActivityLogRow = {
  id: UUID;

  actor_id: UUID | null;
  actor_role: string | null;

  action: string;

  entity_table: string | null;
  entity_id: UUID | null;

  region_id: UUID | null;
  province_id: UUID | null;
  city_id: UUID | null;
  municipality_id: UUID | null;
  barangay_id: UUID | null;

  metadata: Json;

  created_at: ISODateTime;
};

