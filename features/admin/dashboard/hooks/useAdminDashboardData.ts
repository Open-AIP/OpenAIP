"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminDashboardRepo } from "@/lib/repos/admin-dashboard/repo";
import type {
  AdminDashboardFilters,
  AipStatusDistributionVM,
  DashboardSummaryVM,
  LguOptionVM,
  RecentActivityItemVM,
  ReviewBacklogVM,
  UsageMetricsVM,
} from "@/lib/repos/admin-dashboard/types";

const createDefaultFilters = (): AdminDashboardFilters => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 13);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
    lguScope: "all",
    lguId: null,
    aipStatus: "all",
  };
};

export function useAdminDashboardData() {
  const repo = useMemo(() => getAdminDashboardRepo(), []);
  const [filters, setFilters] = useState<AdminDashboardFilters>(() => createDefaultFilters());
  const [summary, setSummary] = useState<DashboardSummaryVM | null>(null);
  const [distribution, setDistribution] = useState<AipStatusDistributionVM[]>([]);
  const [reviewBacklog, setReviewBacklog] = useState<ReviewBacklogVM | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetricsVM | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItemVM[]>([]);
  const [lguOptions, setLguOptions] = useState<LguOptionVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData,
        statusDistribution,
        backlogData,
        metricsData,
        activityData,
        lguList,
      ] = await Promise.all([
        repo.getSummary(filters),
        repo.getAipStatusDistribution(filters),
        repo.getReviewBacklog(filters),
        repo.getUsageMetrics(filters),
        repo.getRecentActivity(filters),
        repo.listLguOptions(),
      ]);
      setSummary(summaryData);
      setDistribution(statusDistribution);
      setReviewBacklog(backlogData);
      setUsageMetrics(metricsData);
      setRecentActivity(activityData);
      setLguOptions(lguList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [filters, repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    filters,
    setFilters,
    summary,
    distribution,
    reviewBacklog,
    usageMetrics,
    recentActivity,
    lguOptions,
    loading,
    error,
    createDefaultFilters,
  };
}
