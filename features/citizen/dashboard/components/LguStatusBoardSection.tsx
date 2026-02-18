import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatting";
import type { CitizenDashboardLguStatusRowVM } from "@/lib/types/viewmodels/dashboard";
import { formatDaysSince } from "../utils";

type LguStatusBoardSectionProps = {
  rows: CitizenDashboardLguStatusRowVM[];
  fiscalYear: number;
};

export default function LguStatusBoardSection({ rows, fiscalYear }: LguStatusBoardSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-semibold text-[#0b5188]">LGU Status Board</h2>
        <p className="text-base text-slate-500">Track publication status across all LGUs for FY {fiscalYear}</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <Table>
          <TableHeader className="bg-[#0f5d8e]">
            <TableRow>
              <TableHead className="text-white">LGU Name</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Duration</TableHead>
              <TableHead className="text-white">Last Updated</TableHead>
              <TableHead className="text-white">Publication Date</TableHead>
              <TableHead className="text-right text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-slate-500">
                  No published LGU entries for this filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.aipId}>
                  <TableCell className="font-medium text-slate-900">{row.lguName}</TableCell>
                  <TableCell>{row.lguType}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700">{row.statusLabel}</Badge>
                  </TableCell>
                  <TableCell>{formatDaysSince(row.publishedDate)}</TableCell>
                  <TableCell>{row.publishedDate ? formatDate(row.publishedDate) : "-"}</TableCell>
                  <TableCell>{row.publishedDate ? formatDate(row.publishedDate) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" className="bg-[#0b5188] hover:bg-[#0a416d]">
                      <Link href={row.href}>View AIP</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
