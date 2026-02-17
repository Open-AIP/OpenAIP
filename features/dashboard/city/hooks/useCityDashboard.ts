"use client";

import { useMemo, useState } from "react";
import { useCityDashboardData } from "./useCityDashboardData";
import { useScope } from "@/features/shared/providers/scope";
import {
  DEFAULT_CITY_TOP_PROJECT_FILTERS,
  mapCityDashboardVM,
} from "../presentation/mapCityDashboardVM";
import type { TopProjectsFiltersVM } from "@/features/dashboard/shared/types";

export function useCityDashboard() {
  const scope = useScope();
  const {
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
  } = useCityDashboardData();

  const [topProjectFilters, setTopProjectFilters] = useState<TopProjectsFiltersVM>(
    DEFAULT_CITY_TOP_PROJECT_FILTERS
  );

  const setYear = (year: number) => {
    setFilters((prev) => ({ ...prev, year }));
  };

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const viewModel = useMemo(
    () =>
      mapCityDashboardVM({
        data,
        filters,
        fiscal_year: filters.year,
        scope: {
          scope_type: scope.scope_type,
          scope_id: scope.scope_id,
        },
        availableYears,
        topProjectFilters,
      }),
    [data, filters, scope.scope_id, scope.scope_type, availableYears, topProjectFilters]
  );

  return {
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
    topProjectFilters,
    setTopProjectFilters,
    setYear,
    setSearch,
    viewModel,
  };
}
