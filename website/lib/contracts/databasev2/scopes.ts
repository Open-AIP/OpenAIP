import type { RoleType } from "./enums";
import type { ISODateTime, UUID } from "./primitives";

/**
 * AIP scope matches the DB rule: exactly one of barangay_id, city_id, municipality_id is non-null.
 * Mirrors constraint: chk_aips_exactly_one_scope
 */
export type AipScopeRef =
  | {
      scope_type: "barangay";
      barangay_id: UUID;
      city_id: null;
      municipality_id: null;
    }
  | {
      scope_type: "city";
      barangay_id: null;
      city_id: UUID;
      municipality_id: null;
    }
  | {
      scope_type: "municipality";
      barangay_id: null;
      city_id: null;
      municipality_id: UUID;
    };

/**
 * Actor context (derived from profiles row).
 * Mirrors chk_profiles_scope_binding:
 * - admin: no geo binding
 * - city_official: city only
 * - municipal_official: municipality only
 * - citizen + barangay_official: barangay only
 *
 * Note: This is a contract type, not validation logic.
 */
export type ActorContext =
  | {
      user_id: UUID;
      role: "admin";
      barangay_id: null;
      city_id: null;
      municipality_id: null;
      is_active?: boolean;
      created_at?: ISODateTime;
    }
  | {
      user_id: UUID;
      role: "city_official";
      barangay_id: null;
      city_id: UUID;
      municipality_id: null;
      is_active?: boolean;
      created_at?: ISODateTime;
    }
  | {
      user_id: UUID;
      role: "municipal_official";
      barangay_id: null;
      city_id: null;
      municipality_id: UUID;
      is_active?: boolean;
      created_at?: ISODateTime;
    }
  | {
      user_id: UUID;
      role: "citizen" | "barangay_official";
      barangay_id: UUID;
      city_id: null;
      municipality_id: null;
      is_active?: boolean;
      created_at?: ISODateTime;
    };

/**
 * Convenience helper when you only want role without the rest.
 * (Still types-only; no runtime behavior.)
 */
export type ActorRole = RoleType;
