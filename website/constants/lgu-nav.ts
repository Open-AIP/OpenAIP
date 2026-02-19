import {
  Activity,
  LayoutDashboard,
  FileText,
  Folder,
  Building2,
  MessageSquare,
  Bot,
  Shield,
  ClipboardList,
  Settings,
  Users,
  Workflow,
} from "lucide-react";
import type { NavItem } from "@/types";

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Account Administration", href: "/admin/account-administration", icon: Users },
  { label: "LGU Management", href: "/admin/lgu-management", icon: Building2 },
  { label: "AIP Monitoring", href: "/admin/aip-monitoring", icon: Activity },
  { label: "Workflow Oversight", href: "/admin/workflow-oversight", icon: Workflow },
  { label: "Feedback Moderation", href: "/admin/feedback-moderation", icon: MessageSquare },
  { label: "Usage Controls", href: "/admin/usage-controls", icon: Settings },
  { label: "Chatbot Controls", href: "/admin/chatbot-controls", icon: Bot },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { label: "System Administration", href: "/admin/system-administration", icon: Shield },
];

export const BARANGAY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/barangay", icon: LayoutDashboard },
  { label: "AIP Management", href: "/barangay/aips", icon: FileText },

  {
    label: "Projects",
    href: "/barangay/projects",
    icon: Folder,
    children: [
      { label: "Health Project", href: "/barangay/projects/health", icon: ClipboardList },
      { label: "Infrastructure Projects", href: "/barangay/projects/infrastructure", icon: ClipboardList },
    ],
  },

  { label: "Feedback", href: "/barangay/comments", icon: MessageSquare },
  { label: "Chatbot", href: "/barangay/chatbot", icon: Bot },
  { label: "Audit & Accountability", href: "/barangay/audit", icon: Shield },
];

export const CITY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/city", icon: LayoutDashboard },
  { label: "AIPs", href: "/city/aips", icon: FileText },
  { label: "Submissions", href: "/city/submissions", icon: ClipboardList },
  
  { label: "Audit", href: "/city/audit", icon: Shield },
  { label: "Feedback", href: "/city/comments", icon: MessageSquare },
  { label: "Chatbot", href: "/city/chatbot", icon: Bot },
  { label: "Projects", href: "/city/projects", icon: Folder,
    children: [
      { label: "Health Project", href: "/city/projects/health", icon: ClipboardList },
      { label: "Infrastructure Projects", href: "/city/projects/infrastructure", icon: ClipboardList },
    ],
   },

];
