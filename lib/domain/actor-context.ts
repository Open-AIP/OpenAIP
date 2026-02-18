import type { AipScopeRef, RoleType } from "@/lib/contracts/databasev2";
import { normalizeToDbRole } from "@/lib/auth/roles";

export type { RoleType } from "@/lib/contracts/databasev2";

export type ScopeKind = AipScopeRef["scope_type"] | "none";

export type ActorScope = {
  kind: ScopeKind;
  id?: string;
};

export type ActorContext = {
  userId: string;
  role: RoleType;
  scope: ActorScope;
};

export type GetUserOutput = {
  userRole?: unknown;
  userLocale?: unknown;
  userId?: unknown;
  id?: unknown;
  [key: string]: unknown;
};

export function isRoleType(value: unknown): value is RoleType {
  return normalizeToDbRole(value) !== null;
}

function getIdValue(
  source: Record<string, unknown> | null,
  snakeKey: string,
  camelKey: string
): string | null {
  if (!source) return null;
  const snake = source[snakeKey];
  if (typeof snake === "string" && snake) return snake;
  const camel = source[camelKey];
  if (typeof camel === "string" && camel) return camel;
  return null;
}

export function mapUserToActorContext(user: GetUserOutput): ActorContext | null {
  const role = normalizeToDbRole(user.userRole);
  if (!role) return null;

  const locale =
    user.userLocale && typeof user.userLocale === "object"
      ? (user.userLocale as Record<string, unknown>)
      : null;

  const userId =
    (typeof user.userId === "string" && user.userId) ||
    (typeof user.id === "string" && user.id) ||
    null;

  if (!userId) return null;

  if (role === "admin") {
    return { userId, role, scope: { kind: "none" } };
  }

  if (role === "city_official") {
    const cityId =
      getIdValue(locale, "city_id", "cityId") ??
      getIdValue(user as Record<string, unknown>, "city_id", "cityId");
    if (!cityId) return null;
    return { userId, role, scope: { kind: "city", id: cityId } };
  }

  if (role === "municipal_official") {
    const municipalityId =
      getIdValue(locale, "municipality_id", "municipalityId") ??
      getIdValue(user as Record<string, unknown>, "municipality_id", "municipalityId");
    if (!municipalityId) return null;
    return { userId, role, scope: { kind: "municipality", id: municipalityId } };
  }

  if (role === "barangay_official" || role === "citizen") {
    const barangayId =
      getIdValue(locale, "barangay_id", "barangayId") ??
      getIdValue(user as Record<string, unknown>, "barangay_id", "barangayId");
    if (!barangayId) return null;
    return { userId, role, scope: { kind: "barangay", id: barangayId } };
  }

  return null;
}
