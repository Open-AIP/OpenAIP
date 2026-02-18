import type { RoleType } from "@/lib/contracts/databasev2/enums";
import type { CanonicalScopeKind } from "./scope";

export type ScopeContextValue = {
  scope_type: CanonicalScopeKind;
  scope_id: string;
  role: RoleType;
  scope_name: string;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

