import {
  LayoutDashboard,
  FileText,
  Folder,
  MessageSquare,
  Bot,
  Shield,
  ClipboardList,
} from "lucide-react";
import type { NavItem } from "@/types";

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
