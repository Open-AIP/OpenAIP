import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAipStatusBadgeClass } from "@/lib/ui/status";
import { getAipStatusLabel } from "@/lib/mappers/submissions";
import { formatDate } from "@/lib/formatting";
import type { CityAipByYearVM } from "../types";

type CityAipsByYearTableProps = {
  cityAipsByYear: CityAipByYearVM[];
};

export default function CityAipsByYearTable({ cityAipsByYear }: CityAipsByYearTableProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">City AIPs by Year</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cityAipsByYear.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.year}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-full ${getAipStatusBadgeClass(row.status)}`}>
                    {getAipStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>{row.uploadedBy}</TableCell>
                <TableCell>{formatDate(row.uploadDate)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="gap-2" onClick={row.onView}>
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
