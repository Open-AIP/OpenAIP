"use client";

import { useMemo } from "react";
import { useAdminDashboardData } from "./useAdminDashboardData";
import { mapAdminDashboardVM } from "../presentation/mapAdminDashboardVM";

export function useAdminDashboard() {
  const {
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
  } = useAdminDashboardData();

  const viewModel = useMemo(
    () =>
      mapAdminDashboardVM({
        filters,
        summary,
        distribution,
        reviewBacklog,
        usageMetrics,
        recentActivity,
        lguOptions,
      }),
    [
      filters,
      summary,
      distribution,
      reviewBacklog,
      usageMetrics,
      recentActivity,
      lguOptions,
    ]
  );

  const handleReset = () => setFilters(createDefaultFilters());

  return {
    filters,
    setFilters,
    viewModel,
    loading,
    error,
    handleReset,
  };
}
