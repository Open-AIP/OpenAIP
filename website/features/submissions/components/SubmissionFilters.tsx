import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AipSubmissionRow } from "@/lib/repos/submissions/repo";
import { getAipStatusLabel } from "../presentation/submissions.presentation";

interface SubmissionFiltersProps {
  aips: AipSubmissionRow[];
  yearFilter: string;
  statusFilter: string;
  barangayFilter: string;
  onYearChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onBarangayChange: (value: string) => void;
}

export function SubmissionFilters({
  aips,
  yearFilter,
  statusFilter,
  barangayFilter,
  onYearChange,
  onStatusChange,
  onBarangayChange,
}: SubmissionFiltersProps) {
  const triggerClassName = "w-full border-slate-200 bg-white hover:bg-white sm:w-[180px]";

  // Extract unique years from AIPs
  const years = Array.from(new Set(aips.map((aip) => aip.year))).sort(
    (a, b) => b - a
  );

  // Extract unique statuses from AIPs
  const statuses = Array.from(new Set(aips.map((aip) => aip.status)));

  // Extract unique barangay names from AIPs
  const barangays = Array.from(
    new Set(aips.map((aip) => aip.barangayName).filter(Boolean))
  ).sort();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-end">
      <Select value={yearFilter} onValueChange={onYearChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {getAipStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={barangayFilter} onValueChange={onBarangayChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder="Barangay" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Barangays</SelectItem>
          {barangays.map((barangay) => (
            <SelectItem key={barangay} value={barangay!}>
              {barangay}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
