import type { RouteRole } from "@/lib/auth/roles";

export type LGUAccount = {
  email: string,
  fullName: string,
  role: RouteRole,
  locale: string
};

export type AuthParameters = {
  role: RouteRole,
  baseURL: string;
}

export type { NavItem, LguVariant } from "./navigation";
