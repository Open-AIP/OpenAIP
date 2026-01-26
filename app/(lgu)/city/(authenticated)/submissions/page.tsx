"use client";

import { useState, useMemo } from "react";
import { MOCK_AIPS } from "@/mock/aips";
import { SubmissionStats } from "@/feature/submissions/SubmissionStats";
import { SubmissionFilters } from "@/feature/submissions/SubmissionFilters";
import { SubmissionTable } from "@/feature/submissions/SubmissionTable";
import { AipStatus } from "@/types/aip";

export default function CitySubmissionsPage() {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");

  // Get all barangay AIPs for city review
  const barangayAIPs = useMemo(
    () => MOCK_AIPS.filter((aip) => aip.scope === "barangay"),
    []
  );

  // Filter AIPs
  const filteredAIPs = useMemo(() => {
    return barangayAIPs.filter((aip) => {
      const yearMatch = yearFilter === "all" || aip.year === Number(yearFilter);
      const statusMatch = statusFilter === "all" || aip.status === statusFilter;
      const barangayMatch = barangayFilter === "all" || aip.barangayName === barangayFilter;
      return yearMatch && statusMatch && barangayMatch;
    });
  }, [barangayAIPs, yearFilter, statusFilter, barangayFilter]);

  // Calculate statistics
  const stats = useMemo(
    () => ({
      total: barangayAIPs.length,
      published: barangayAIPs.filter((a) => a.status === "Published").length,
      underReview: barangayAIPs.filter((a) => a.status === "Under Review").length,
      pendingReview: barangayAIPs.filter((a) => a.status === "Pending Review").length,
      forRevision: barangayAIPs.filter((a) => a.status === "For Revision").length,
    }),
    [barangayAIPs]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Barangay Submissions</h1>
        <p className="mt-2 text-sm text-slate-600">
          Filter and review barangay Annual Investment Plans submitted for approval.
        </p>
      </div>

      {/* Statistics Cards */}
      <SubmissionStats stats={stats} />

      {/* Filters */}
      <SubmissionFilters
        aips={barangayAIPs}
        yearFilter={yearFilter}
        statusFilter={statusFilter}
        barangayFilter={barangayFilter}
        onYearChange={setYearFilter}
        onStatusChange={setStatusFilter}
        onBarangayChange={setBarangayFilter}
      />

      {/* Submitted AIP Lists */}
      <SubmissionTable aips={filteredAIPs} />
    </div>
  );
}
