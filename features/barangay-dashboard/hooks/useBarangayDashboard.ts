"use client";

import { useEffect, useMemo, useState } from "react";
import { getBarangayDashboardRepo } from "@/lib/repos/barangay-dashboard/repo";
import {
  BARANGAY_DASHBOARD_DEFAULT_YEAR,
  BARANGAY_DASHBOARD_SCOPE,
} from "@/mocks/fixtures/barangay/barangay-dashboard.fixture";
import type { BarangayDashboardData, BarangayDashboardFilters } from "../types";

const createDefaultFilters = (): BarangayDashboardFilters => ({
  year: BARANGAY_DASHBOARD_DEFAULT_YEAR,
  search: "",
  sector: "all",
  projectType: "all",
});

export function useBarangayDashboard() {
  const repo = useMemo(() => getBarangayDashboardRepo(), []);

  const [filters, setFilters] = useState<BarangayDashboardFilters>(createDefaultFilters);
  const [availableYears, setAvailableYears] = useState<number[]>([BARANGAY_DASHBOARD_DEFAULT_YEAR]);
  const [data, setData] = useState<BarangayDashboardData | null>(null);
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
        setError(err instanceof Error ? err.message : "Failed to load barangay dashboard.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [repo, filters]);

  const totalBudget = useMemo(() => {
    if (!data) return 0;
    return data.budgetBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const setYear = (year: number) => {
    setFilters((prev) => ({ ...prev, year }));
  };

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const setSector = (sector: BarangayDashboardFilters["sector"]) => {
    setFilters((prev) => ({ ...prev, sector }));
  };

  const setProjectType = (projectType: BarangayDashboardFilters["projectType"]) => {
    setFilters((prev) => ({ ...prev, projectType }));
  };

  return {
    scope: BARANGAY_DASHBOARD_SCOPE,
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
    totalBudget,
    setYear,
    setSearch,
    setSector,
    setProjectType,
  };
}
