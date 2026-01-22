import type { NavItem } from "@/types";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  MessageSquare,
  Bot,
  User,
  ShieldCheck,
  Heart,
  Building2,
} from "lucide-react";

/**
 * NOTE about URLs:
 * Because you're using route groups like (dashboard), the URL is still:
 * - /barangay
 * - /barangay/aips
 * etc.
 */
export const BARANGAY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/barangay", icon: LayoutDashboard },
  { label: "AIP Management", href: "/barangay/aips", icon: FileText },
  { 
    label: "Projects", 
    href: "/barangay/projects", 
    icon: FolderKanban,
    children: [
      { label: "Health Project", href: "/barangay/projects/health", icon: Heart },
      { label: "Infrastructure Projects", href: "/barangay/projects/infrastructure", icon: Building2 },
    ]
  },
  { label: "Comments", href: "/barangay/comments", icon: MessageSquare },
  { label: "Chatbot", href: "/barangay/chatbot", icon: Bot },
  { label: "Account", href: "/barangay/account", icon: User },
  { label: "Audit & Accountability", href: "/barangay/audit", icon: ShieldCheck },
];

export const CITY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/city", icon: LayoutDashboard },
  { label: "AIPs", href: "/city/aips", icon: FileText },
  { 
    label: "Projects", 
    href: "/city/projects", 
    icon: FolderKanban,
    children: [
      { label: "Health Project", href: "/city/projects/health", icon: Heart },
      { label: "Infrastructure Projects", href: "/city/projects/infrastructure", icon: Building2 },
    ]
  },
  { label: "Chatbot", href: "/city/chatbot", icon: Bot },
  { label: "Account", href: "/city/account", icon: User },
];
