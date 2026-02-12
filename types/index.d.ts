export type LGUAccount = {
  email: string,
  fullName: string,
  role: string,
  locale: string
};

export type AuthParameters = {
  role: string,
  baseURL: string;
}

export type { NavItem, LguVariant } from "./navigation";
