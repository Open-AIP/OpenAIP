"use client";

import { useEffect, useMemo, useState } from "react";
import { BudgetAllocationTable, buildBudgetAllocation } from "@/features/aip/components/budget-allocation-table";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips";
import type { AipProjectRow } from "@/lib/repos/aip/types";

const CitizenBudgetAllocationPage = () => {
  const [rows, setRows] = useState<AipProjectRow[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const repo = getCitizenAipRepo();
      const latestRows = await repo.getLatestAipProjectRows();
      if (active) setRows(latestRows);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const allocation = useMemo(() => buildBudgetAllocation(rows), [rows]);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Budget Allocation</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        View how public funds are distributed by service category and priority area to support transparent,
        evidence-based monitoring for citizens and stakeholders.
      </p>

      <BudgetAllocationTable
        rows={allocation.rows}
        totalBudget={allocation.totalBudget}
        totalProjects={allocation.totalProjects}
      />
    </section>
  );
};

export default CitizenBudgetAllocationPage;
