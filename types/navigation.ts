import type { LucideIcon } from "lucide-react";

import type { LguScopeKind } from "@/lib/auth/scope";

export type LguVariant = LguScopeKind;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
};
