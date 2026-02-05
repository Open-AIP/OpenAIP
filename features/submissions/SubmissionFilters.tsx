import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AipSubmissionItem } from "./types/submissions.types";
import { getAipStatusLabel } from "./presentation/submissions.presentation";

interface SubmissionFiltersProps {
  aips: AipSubmissionItem[];
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
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={yearFilter} onValueChange={onYearChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
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
      </CardContent>
    </Card>
  );
}
