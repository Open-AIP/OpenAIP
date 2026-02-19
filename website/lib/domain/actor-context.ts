import type { AipScopeRef, RoleType } from "@/lib/contracts/databasev2";

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
  role?: unknown;
  userRole?: unknown;
  routeRole?: unknown;
  userId?: unknown;
  id?: unknown;
  scope?: unknown;
  barangay_id?: unknown;
  city_id?: unknown;
  municipality_id?: unknown;
  barangayId?: unknown;
  cityId?: unknown;
  municipalityId?: unknown;
  [key: string]: unknown;
};

export function isRoleType(value: unknown): value is RoleType {
  return (
    value === "citizen" ||
    value === "barangay_official" ||
    value === "city_official" ||
    value === "municipal_official" ||
    value === "admin"
  );
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

function mapRouteRoleToRoleType(value: unknown): RoleType | null {
  if (value === "citizen") return "citizen";
  if (value === "barangay") return "barangay_official";
  if (value === "city") return "city_official";
  if (value === "municipality") return "municipal_official";
  if (value === "admin") return "admin";
  return null;
}

export function mapUserToActorContext(user: GetUserOutput): ActorContext | null {
  const role =
    (isRoleType(user.role) && user.role) ||
    (isRoleType(user.userRole) && user.userRole) ||
    mapRouteRoleToRoleType(user.routeRole) ||
    mapRouteRoleToRoleType(user.userRole);

  if (!role) return null;

  const scope =
    user.scope && typeof user.scope === "object"
      ? (user.scope as Record<string, unknown>)
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
      getIdValue(scope, "city_id", "cityId") ??
      getIdValue(user as Record<string, unknown>, "city_id", "cityId");
    if (!cityId) return null;
    return { userId, role, scope: { kind: "city", id: cityId } };
  }

  if (role === "municipal_official") {
    const municipalityId =
      getIdValue(scope, "municipality_id", "municipalityId") ??
      getIdValue(user as Record<string, unknown>, "municipality_id", "municipalityId");
    if (!municipalityId) return null;
    return { userId, role, scope: { kind: "municipality", id: municipalityId } };
  }

  if (role === "barangay_official" || role === "citizen") {
    const barangayId =
      getIdValue(scope, "barangay_id", "barangayId") ??
      getIdValue(user as Record<string, unknown>, "barangay_id", "barangayId");
    if (!barangayId) return null;
    return { userId, role, scope: { kind: "barangay", id: barangayId } };
  }

  return null;
}
