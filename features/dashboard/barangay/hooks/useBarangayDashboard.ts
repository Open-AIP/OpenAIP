"use client";

import { useMemo } from "react";
import { useBarangayDashboardData } from "./useBarangayDashboardData";
import { mapBarangayDashboardVM } from "../presentation/mapBarangayDashboardVM";
import type { BarangayDashboardFilters, TopProjectsFilterChange } from "../types";

export function useBarangayDashboard() {
  const {
    scope,
    filters,
    setFilters,
    data,
    availableYears,
    totalBudget,
    isLoading,
    error,
  } = useBarangayDashboardData();

  const setYear = (year: number) => {
    setFilters((prev) => ({ ...prev, year }));
  };

  const setGlobalSearch = (globalSearch: string) => {
    setFilters((prev) => ({ ...prev, globalSearch }));
  };

  const setTableSearch = (tableSearch: string) => {
    setFilters((prev) => ({ ...prev, tableSearch }));
  };

  const setSectorCode = (sector_code: BarangayDashboardFilters["sector_code"]) => {
    setFilters((prev) => ({ ...prev, sector_code }));
  };

  const setProjectType = (projectType: BarangayDashboardFilters["projectType"]) => {
    setFilters((prev) => ({ ...prev, projectType }));
  };

  const setTopProjectsFilters = (change: TopProjectsFilterChange) => {
    setFilters((prev) => ({
      ...prev,
      tableSearch: change.search ?? prev.tableSearch,
      sector_code: change.sector_code ?? prev.sector_code,
      projectType: (change.type as BarangayDashboardFilters["projectType"]) ?? prev.projectType,
    }));
  };

  const viewModel = useMemo(
    () =>
      mapBarangayDashboardVM({
        data,
        filters,
        fiscal_year: filters.year,
        scope: {
          scope_type: scope.scope_type,
          scope_id: scope.scope_id,
        },
        availableYears,
        totalBudget,
      }),
    [data, filters, scope.scope_id, scope.scope_type, availableYears, totalBudget]
  );

  return {
    scope,
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
    totalBudget,
    setYear,
    setGlobalSearch,
    setTableSearch,
    setSectorCode,
    setProjectType,
    setTopProjectsFilters,
    viewModel,
  };
}
