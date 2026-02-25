"use client";

import { useMemo } from "react";
import CitizenFiltersBar from "@/features/citizen/components/citizen-filters-bar";

type ProjectFiltersProps = {
  fiscalYears: number[];
  fiscalYearFilter: string;
  onFiscalYearChange: (value: string) => void;
  scopeOptions: string[];
  scopeFilter: string;
  onScopeChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
};

export default function ProjectFilters({
  fiscalYears,
  fiscalYearFilter,
  onFiscalYearChange,
  scopeOptions,
  scopeFilter,
  onScopeChange,
  query,
  onQueryChange,
}: ProjectFiltersProps) {
  const yearOptions = useMemo(
    () => ["all", ...fiscalYears.map((year) => String(year))],
    [fiscalYears]
  );

  return (
    <CitizenFiltersBar
      yearOptions={yearOptions}
      yearValue={fiscalYearFilter}
      onYearChange={onFiscalYearChange}
      lguOptions={scopeOptions}
      lguValue={scopeFilter}
      onLguChange={onScopeChange}
      searchValue={query}
      onSearchChange={onQueryChange}
      searchPlaceholder="Search projects..."
    />
  );
}
