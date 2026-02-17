"use client";

import { useEffect, useMemo, useState } from "react";
import { getCityDashboardRepo } from "@/lib/repos/city-dashboard";
import { getAvailableFiscalYears } from "@/features/shared/providers/yearOptions";
import { useScope } from "@/features/shared/providers/scope";
import type { CityDashboardData, CityDashboardFilters } from "../types";

const createDefaultFilters = (fiscalYear: number, cityId: string): CityDashboardFilters => ({
  year: fiscalYear,
  search: "",
  cityId,
});

export function useCityDashboardData() {
  const scope = useScope();
  const repo = useMemo(() => getCityDashboardRepo(), []);
  const defaultFiscalYears = useMemo(
    () => getAvailableFiscalYears(scope.scope_type),
    [scope.scope_type]
  );
  const defaultFiscalYear = defaultFiscalYears[0] ?? new Date().getFullYear();
  const cityScopeId = scope.city_id ?? scope.scope_id;

  const [filters, setFilters] = useState<CityDashboardFilters>(() => createDefaultFilters(defaultFiscalYear, cityScopeId));
  const [availableYears, setAvailableYears] = useState<number[]>(defaultFiscalYears);
  const [data, setData] = useState<CityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultFiscalYears.length > 0) {
      setAvailableYears(defaultFiscalYears);
      setFilters((prev) => ({
        ...prev,
        year: defaultFiscalYears.includes(prev.year) ? prev.year : defaultFiscalYears[0],
      }));
    }
  }, [defaultFiscalYears]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, cityId: cityScopeId }));
  }, [cityScopeId]);

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

  return {
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
  };
}
