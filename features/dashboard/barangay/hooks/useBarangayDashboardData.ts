"use client";

import { useEffect, useMemo, useState } from "react";
import { getBarangayDashboardRepo } from "../repo/barangayDashboard.repo";
import { getAvailableFiscalYears } from "@/features/shared/providers/yearOptions";
import { useScope } from "@/features/shared/providers/scope";
import type { BarangayDashboardData, BarangayDashboardFilters } from "../types";

const createDefaultFilters = (fiscalYear: number): BarangayDashboardFilters => ({
  year: fiscalYear,
  globalSearch: "",
  tableSearch: "",
  sector_code: "all",
  projectType: "all",
});

export function useBarangayDashboardData() {
  const scope = useScope();
  const repo = useMemo(() => getBarangayDashboardRepo(), []);
  const defaultFiscalYears = useMemo(
    () => getAvailableFiscalYears(scope.scope_type),
    [scope.scope_type]
  );
  const defaultFiscalYear = defaultFiscalYears[0] ?? new Date().getFullYear();

  const [filters, setFilters] = useState<BarangayDashboardFilters>(() => createDefaultFilters(defaultFiscalYear));
  const [availableYears, setAvailableYears] = useState<number[]>(defaultFiscalYears);
  const [data, setData] = useState<BarangayDashboardData | null>(null);
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

  return {
    scope,
    filters,
    setFilters,
    data,
    availableYears,
    totalBudget,
    isLoading,
    error,
  };
}
