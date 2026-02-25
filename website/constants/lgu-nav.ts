import {
  Activity,
  LayoutDashboard,
  LayoutGrid,
  FileText,
  Folder,
  Building2,
  MessageSquare,
  Bot,
  Shield,
  ClipboardList,
  ClipboardCheck,
  Heart,
  Settings,
  Users,
  UserRound,
} from "lucide-react";
import type { NavItem } from "@/types";

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Account Administration", href: "/admin/account-administration", icon: Users },
  { label: "LGU Management", href: "/admin/lgu-management", icon: Building2 },
  { label: "AIP Monitoring", href: "/admin/aip-monitoring", icon: Activity },
  { label: "Feedback Moderation", href: "/admin/feedback-moderation", icon: MessageSquare },
  { label: "Usage Controls", href: "/admin/usage-controls", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { label: "System Administration", href: "/admin/system-administration", icon: Shield },
];

export const BARANGAY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/barangay", icon: LayoutGrid },
  { label: "AIP Management", href: "/barangay/aips", icon: FileText },

  {
    label: "Projects",
    href: "/barangay/projects",
    icon: Folder,
    children: [
      { label: "Health Project", href: "/barangay/projects/health", icon: Heart },
      { label: "Infrastructure Projects", href: "/barangay/projects/infrastructure", icon: Building2 },
    ],
  },

  { label: "Comments", href: "/barangay/comments", icon: MessageSquare },
  { label: "Chatbot", href: "/barangay/chatbot", icon: Bot },
  { label: "Account", href: "/barangay/account", icon: UserRound },
  { label: "Audit & Accountability", href: "/barangay/audit", icon: Shield },
];

export const CITY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/city", icon: LayoutGrid },
  { label: "Barangay Submissions", href: "/city/submissions", icon: ClipboardCheck },
  { label: "City AIP Management", href: "/city/aips", icon: FileText },
  {
    label: "Projects",
    href: "/city/projects",
    icon: Folder,
    children: [
      { label: "Health Project", href: "/city/projects/health", icon: Heart },
      { label: "Infrastructure Projects", href: "/city/projects/infrastructure", icon: Building2 },
    ],
  },
  { label: "Comments", href: "/city/comments", icon: MessageSquare },
  { label: "Chatbot", href: "/city/chatbot", icon: Bot },
  { label: "Account", href: "/city/account", icon: UserRound },
  { label: "Audit & Accountability", href: "/city/audit", icon: Shield },
];
