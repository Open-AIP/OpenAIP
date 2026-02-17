"use client";

import { useMemo, useState } from "react";
import { useCityDashboardData } from "./useCityDashboardData";
import {
  DEFAULT_CITY_TOP_PROJECT_FILTERS,
  mapCityDashboardVM,
} from "../presentation/mapCityDashboardVM";
import type { TopProjectsFiltersVM } from "@/features/dashboard/shared/types";

export function useCityDashboard() {
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
        availableYears,
        topProjectFilters,
      }),
    [data, filters, availableYears, topProjectFilters]
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
