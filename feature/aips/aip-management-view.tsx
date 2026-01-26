/**
 * AIP Management View Component
 * 
 * Main management interface for Annual Investment Plans.
 * Provides filtering, searching, and upload capabilities for AIP documents.
 * Displays a list of AIP records with year-based filtering.
 * 
 * @module feature/aips/aip-management-view
 */

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import AipCard from "@/feature/aips/aip-card";
import type { AipRecord } from "@/types";
import { getAipYears } from "@/mock/aips";
import { Plus } from "lucide-react";
import UploadAipDialog from "@/feature/aips/upload-aip-dialog";

/**
 * Props for AipManagementView component
 */
type Props = {
  /** Array of AIP records to display */
  records: AipRecord[];
  /** Administrative scope for routing */
  scope?: "city" | "barangay";
};

/**
 * AipManagementView Component
 * 
 * Manages the display and organization of AIP documents.
 * Features:
 * - Year-based filtering
 * - Upload new AIP functionality
 * - Displays AIP count
 * - Responsive card-based layout
 * 
 * @param records - Array of AIP records to manage
 * @param scope - Administrative scope (city or barangay)
 */
export default function AipManagementView({ 
  records, 
  scope = "barangay"
}: Props) {
  const years = useMemo(() => getAipYears(records), [records]);

  const [yearFilter, setYearFilter] = useState<string>("all");
  const [openUpload, setOpenUpload] = useState(false);

  const filtered = useMemo(() => {
    if (yearFilter === "all") return records;
    const y = Number(yearFilter);
    return records.filter((r) => r.year === y);
  }, [records, yearFilter]);

  const scopeLabel = scope === "city" ? "city" : "barangay";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AIP Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage, upload, review, and monitor Annual Investment Plan (AIP) documents for {scopeLabel} development.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">Showing {filtered.length} AIPs</div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="bg-[#022437] hover:bg-[#022437]/90"
            onClick={() => setOpenUpload(true)}
          >
            <Plus className="h-4 w-4" />
            Upload New AIP
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((aip) => (
          <AipCard key={aip.id} aip={aip} scope={scope} />
        ))}
      </div>

      <UploadAipDialog
        open={openUpload}
        onOpenChange={setOpenUpload}
        scope={scope}
        onSubmit={({ file, year }) => {
          // mock handling for now
          console.log("Upload payload:", { file, year, scope });
          setOpenUpload(false);

          // later: Supabase storage upload + create aip record
        }}        
      />
    </div>
  );
}
