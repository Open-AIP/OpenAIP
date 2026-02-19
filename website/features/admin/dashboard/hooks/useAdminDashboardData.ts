"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAdminDashboardRepo } from "@/lib/repos/admin-dashboard";
import {
  getDateDaysAgoInTimeZoneYmd,
  getTodayInTimeZoneYmd,
} from "@/lib/date/localDate";
import type {
  AdminDashboardFilters,
  AipStatusDistributionVM,
  DashboardSummaryVM,
  LguOptionVM,
  RecentActivityItemVM,
  ReviewBacklogVM,
  UsageMetricsVM,
} from "@/lib/repos/admin-dashboard/types";

const ASIA_MANILA_TIMEZONE = "Asia/Manila";

const createDefaultFilters = (): AdminDashboardFilters => {
  return {
    dateFrom: getDateDaysAgoInTimeZoneYmd(ASIA_MANILA_TIMEZONE, 13),
    dateTo: getTodayInTimeZoneYmd(ASIA_MANILA_TIMEZONE),
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
  const [staticLoading, setStaticLoading] = useState(true);
  const [reactiveLoading, setReactiveLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadStaticData() {
      setStaticLoading(true);
      try {
        const lguList = await repo.listLguOptions();
        if (!isActive || !isMountedRef.current) return;
        setLguOptions(lguList);
      } catch (err) {
        if (!isActive || !isMountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        if (isActive && isMountedRef.current) {
          setStaticLoading(false);
        }
      }
    }

    loadStaticData();

    return () => {
      isActive = false;
    };
  }, [repo]);

  useEffect(() => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    let isActive = true;

    async function loadReactiveData() {
      setReactiveLoading(true);
      setError(null);

      try {
        const [summaryData, statusDistribution, backlogData, metricsData, activityData] = await Promise.all([
          repo.getSummary(filters),
          repo.getAipStatusDistribution(filters),
          repo.getReviewBacklog(filters),
          repo.getUsageMetrics(filters),
          repo.getRecentActivity(filters),
        ]);

        if (!isActive || !isMountedRef.current || requestIdRef.current !== currentRequestId) return;

        setSummary(summaryData);
        setDistribution(statusDistribution);
        setReviewBacklog(backlogData);
        setUsageMetrics(metricsData);
        setRecentActivity(activityData);
      } catch (err) {
        if (!isActive || !isMountedRef.current || requestIdRef.current !== currentRequestId) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        if (isActive && isMountedRef.current && requestIdRef.current === currentRequestId) {
          setReactiveLoading(false);
        }
      }
    }

    loadReactiveData();

    return () => {
      isActive = false;
    };
  }, [filters, repo]);

  const loading = staticLoading || reactiveLoading;

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
