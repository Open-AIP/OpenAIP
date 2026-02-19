import type { RoleType } from "@/lib/contracts/databasev2";

export type RouteRole =
  | "citizen"
  | "barangay"
  | "city"
  | "municipality"
  | "admin";

export type DbRole = RoleType;

export const ROUTE_TO_DB_ROLE: Record<RouteRole, DbRole> = {
  citizen: "citizen",
  barangay: "barangay_official",
  city: "city_official",
  municipality: "municipal_official",
  admin: "admin",
};

export const DB_TO_ROUTE_ROLE: Record<DbRole, RouteRole> = {
  citizen: "citizen",
  barangay_official: "barangay",
  city_official: "city",
  municipal_official: "municipality",
  admin: "admin",
};

export function isDbRole(value: unknown): value is DbRole {
  return (
    value === "citizen" ||
    value === "barangay_official" ||
    value === "city_official" ||
    value === "municipal_official" ||
    value === "admin"
  );
}

export function isRouteRole(value: unknown): value is RouteRole {
  return (
    value === "citizen" ||
    value === "barangay" ||
    value === "city" ||
    value === "municipality" ||
    value === "admin"
  );
}

export function routeRoleToDbRole(role: RouteRole): DbRole {
  return ROUTE_TO_DB_ROLE[role];
}

export function dbRoleToRouteRole(role: DbRole): RouteRole {
  return DB_TO_ROUTE_ROLE[role];
}

export function normalizeToDbRole(role: unknown): DbRole | null {
  if (isDbRole(role)) return role;
  if (isRouteRole(role)) return routeRoleToDbRole(role);
  return null;
}

