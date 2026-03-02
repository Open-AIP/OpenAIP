"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAdminDashboardRepo } from "@/lib/repos/admin-dashboard";
import {
  getDateDaysAgoInTimeZoneYmd,
  getTodayInTimeZoneYmd,
} from "@/lib/date/localDate";
import type {
  AdminDashboardSnapshot,
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

export type AdminDashboardInitialData = {
  filters: AdminDashboardFilters;
  snapshot: AdminDashboardSnapshot;
};

function areFiltersEqual(left: AdminDashboardFilters, right: AdminDashboardFilters): boolean {
  return (
    left.dateFrom === right.dateFrom &&
    left.dateTo === right.dateTo &&
    left.lguScope === right.lguScope &&
    left.lguId === right.lguId &&
    left.aipStatus === right.aipStatus
  );
}

export function useAdminDashboardData(initial?: AdminDashboardInitialData) {
  const repo = useMemo(() => getAdminDashboardRepo(), []);
  const initialDataRef = useRef(initial ?? null);
  const [filters, setFilters] = useState<AdminDashboardFilters>(() =>
    initialDataRef.current?.filters ?? createDefaultFilters()
  );
  const [summary, setSummary] = useState<DashboardSummaryVM | null>(
    () => initialDataRef.current?.snapshot.summary ?? null
  );
  const [distribution, setDistribution] = useState<AipStatusDistributionVM[]>(
    () => initialDataRef.current?.snapshot.distribution ?? []
  );
  const [reviewBacklog, setReviewBacklog] = useState<ReviewBacklogVM | null>(
    () => initialDataRef.current?.snapshot.reviewBacklog ?? null
  );
  const [usageMetrics, setUsageMetrics] = useState<UsageMetricsVM | null>(
    () => initialDataRef.current?.snapshot.usageMetrics ?? null
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivityItemVM[]>(
    () => initialDataRef.current?.snapshot.recentActivity ?? []
  );
  const [lguOptions, setLguOptions] = useState<LguOptionVM[]>(
    () => initialDataRef.current?.snapshot.lguOptions ?? []
  );
  const [staticLoading, setStaticLoading] = useState(() => !initialDataRef.current);
  const [reactiveLoading, setReactiveLoading] = useState(() => !initialDataRef.current);
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
      if (initialDataRef.current) {
        setStaticLoading(false);
        return;
      }

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
      const initialData = initialDataRef.current;
      if (initialData && areFiltersEqual(filters, initialData.filters)) {
        initialDataRef.current = null;
        setReactiveLoading(false);
        setError(null);
        return;
      }

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
