"use client";

import { useMemo, useState } from "react";
import { SubmissionStats } from "../components/SubmissionStats";
import { SubmissionFilters } from "../components/SubmissionFilters";
import { SubmissionTable } from "../components/SubmissionTable";
import type { ListSubmissionsResult } from "../data/submissionsReview.contracts";

export default function SubmissionsView({ data }: { data: ListSubmissionsResult }) {
  const aips = data.rows;
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");

  const filteredAips = useMemo(() => {
    return aips.filter((aip) => {
      const yearMatch = yearFilter === "all" || aip.year === Number(yearFilter);
      const statusMatch = statusFilter === "all" || aip.status === statusFilter;
      const barangayMatch =
        barangayFilter === "all" || aip.barangayName === barangayFilter;
      return yearMatch && statusMatch && barangayMatch;
    });
  }, [aips, barangayFilter, statusFilter, yearFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Barangay Submissions</h1>
        <p className="mt-2 text-sm text-slate-600">
          Filter and review barangay Annual Investment Plans submitted for approval.
        </p>
      </div>

      <SubmissionStats stats={data.counts} />

      <SubmissionFilters
        aips={aips}
        yearFilter={yearFilter}
        statusFilter={statusFilter}
        barangayFilter={barangayFilter}
        onYearChange={setYearFilter}
        onStatusChange={setStatusFilter}
        onBarangayChange={setBarangayFilter}
      />

      <SubmissionTable aips={filteredAips} />
    </div>
  );
}

