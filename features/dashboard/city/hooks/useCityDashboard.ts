"use client";

import { useEffect, useMemo, useState } from "react";
import { getCityDashboardRepo } from "@/lib/repos/city-dashboard/repo";
import {
  CITY_DASHBOARD_DEFAULT_YEAR,
  CITY_DASHBOARD_SCOPE,
} from "@/mocks/fixtures/city/city-dashboard.fixture";
import type { CityDashboardData, CityDashboardFilters } from "../types";

const createDefaultFilters = (): CityDashboardFilters => ({
  year: CITY_DASHBOARD_DEFAULT_YEAR,
  search: "",
  cityId: CITY_DASHBOARD_SCOPE.cityId,
});

export function useCityDashboard() {
  const repo = useMemo(() => getCityDashboardRepo(), []);

  const [filters, setFilters] = useState<CityDashboardFilters>(createDefaultFilters);
  const [availableYears, setAvailableYears] = useState<number[]>([CITY_DASHBOARD_DEFAULT_YEAR]);
  const [data, setData] = useState<CityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadYears() {
      try {
        const years = await repo.listAvailableYears();
        if (!isActive || years.length === 0) return;
        setAvailableYears(years);
      } catch {
        if (!isActive) return;
      }
    }

    loadYears();

    return () => {
      isActive = false;
    };
  }, [repo]);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await repo.getDashboard(filters);
        if (!isActive) return;
        setData(result);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load city dashboard.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [repo, filters]);

  const setYear = (year: number) => {
    setFilters((prev) => ({ ...prev, year }));
  };

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  return {
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
    setYear,
    setSearch,
  };
}
