"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AdminDashboardFilters } from "@/lib/repos/admin-dashboard/types";
import type { AdminDashboardActions } from "@/features/admin/dashboard/types/dashboard-actions";
import AdminDashboardView from "@/features/admin/dashboard/views/admin-dashboard-view";

function buildQuery(filters: AdminDashboardFilters, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.lguScope !== "all") params.set("lguScope", filters.lguScope);
  if (filters.lguId) params.set("lguId", filters.lguId);
  if (filters.aipStatus !== "all") params.set("status", filters.aipStatus);
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => params.set(key, value));
  }
  return params.toString();
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const actions = useMemo<AdminDashboardActions>(
    () => ({
      onOpenLguManagement: ({ filters }) => {
        router.push(`/admin/lgu-management?${buildQuery(filters)}`);
      },
      onOpenAccounts: ({ filters }) => {
        router.push(`/admin/account-administration?${buildQuery(filters)}`);
      },
      onOpenFeedbackModeration: ({ filters }) => {
        router.push(`/admin/feedback-moderation?${buildQuery(filters)}`);
      },
      onOpenAipMonitoring: ({ filters, status }) => {
        const query = buildQuery(filters, status ? { status } : undefined);
        router.push(`/admin/aip-monitoring?${query}`);
      },
      onOpenAuditLogs: ({ filters }) => {
        router.push(`/admin/audit-logs?${buildQuery(filters)}`);
      },
    }),
    [router]
  );

  return <AdminDashboardView actions={actions} />;
}
