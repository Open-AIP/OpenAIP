import type { AdminDashboardFilters } from "@/lib/repos/admin-dashboard/types";

export type AdminDashboardActions = {
  onOpenLguManagement?: (args: { filters: AdminDashboardFilters }) => void;
  onOpenAccounts?: (args: { filters: AdminDashboardFilters }) => void;
  onOpenFeedbackModeration?: (args: { filters: AdminDashboardFilters }) => void;
  onOpenAipMonitoring?: (args: { filters: AdminDashboardFilters; status?: string }) => void;
  onOpenAuditLogs?: (args: { filters: AdminDashboardFilters }) => void;
};
