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
                <Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 text-teal-700">
                  {row.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
                  {typeLabel(row.type)}
                </Badge>
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
