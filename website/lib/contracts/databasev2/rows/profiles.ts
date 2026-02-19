import type { RoleType } from "../enums";
import type { ISODateTime, UUID } from "../primitives";

export type ProfileRow = {
  id: UUID;
  role: RoleType;

  full_name: string | null;
  email: string | null;

  barangay_id: UUID | null;
  city_id: UUID | null;
  municipality_id: UUID | null;

  is_active: boolean;

  created_at: ISODateTime;
  updated_at: ISODateTime;
};

