import type { LucideIcon } from "lucide-react";

export type LguVariant = "barangay" | "city";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
};
