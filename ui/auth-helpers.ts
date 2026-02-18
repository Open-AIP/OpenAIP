/**
 * Authentication and authorization helper utilities (UI-layer).
 */
import type { RouteRole } from "@/lib/auth/roles";

export function getRolePath(baseURL: string, role: RouteRole): string {
  return `${baseURL}${role === "citizen" ? "" : "/" + role}`;
}

export function getRoleDisplayName(role: RouteRole): string {
  if (role === "citizen") return "Citizen";
  if (role === "admin") return "Administrator";
  if (role === "municipality") return "Municipal Official";
  return `${role.charAt(0).toUpperCase()}${role.slice(1)} Official`;
}

export function getRoleEmailPlaceholder(role: RouteRole): string {
  return role + `${role === "citizen" ? "" : "-official"}@email.com`;
}

