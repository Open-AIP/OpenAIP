import { Building2, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProjectStatusBadgeClass } from "@/features/projects/utils/status-badges";
import { formatPeso } from "@/lib/formatting";
import type { TopProjectRowVM } from "../types";

type TopProjectsTableProps = {
  rows: TopProjectRowVM[];
};

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function typeLabel(type: TopProjectRowVM["type"]): string {
  if (type === "health") return "Health";
  if (type === "infrastructure") return "Infrastructure";
  return "Other";
}

function categoryBadgeClass(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory === "economic") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (normalizedCategory === "social") return "border-blue-300 bg-blue-50 text-blue-700";
  if (normalizedCategory === "general") return "border-teal-300 bg-teal-50 text-teal-700";
  if (normalizedCategory === "other") return "border-amber-300 bg-amber-50 text-amber-700";

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function typeIcon(type: TopProjectRowVM["type"]) {
  if (type === "health") {
    return <HeartPulse className="h-4 w-4 text-slate-500" aria-hidden="true" />;
  }

  if (type === "infrastructure") {
    return <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />;
  }

  return null;
}

export default function TopProjectsTable({ rows }: TopProjectsTableProps) {
  return (
    <div className="rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.rank}</TableCell>
              <TableCell className="font-medium text-slate-800">{row.projectName}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-full ${categoryBadgeClass(row.category)}`}>
                  {row.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center gap-2 text-slate-700">
                  {typeIcon(row.type)}
                  <span>{typeLabel(row.type)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{formatPeso(row.budget)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-full ${getProjectStatusBadgeClass(row.status)}`}>
                  {formatStatusLabel(row.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
