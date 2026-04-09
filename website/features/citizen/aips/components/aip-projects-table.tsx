'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleHelp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AipDetails, AipProjectSector } from '@/features/citizen/aips/types';
import { formatCurrency } from '@/features/citizen/aips/data/aips.data';

const SECTOR_TABS: AipProjectSector[] = ['General Sector', 'Social Sector', 'Economic Sector', 'Other Services'];
const PAGE_SIZE = 10;
type CitizenProjectStatus = "aiFlaggedNoLguNote" | "hasLguNote" | "noIssues";

const CITIZEN_PROJECT_STATUS_STYLES: Record<
  CitizenProjectStatus,
  {
    rowClass: string;
    cellTextClass: string;
    legendLabel: string;
    legendSwatchClass: string;
    legendSwatchTestId: string;
  }
> = {
  aiFlaggedNoLguNote: {
    rowClass: "bg-rose-500 hover:bg-rose-600",
    cellTextClass: "text-slate-900",
    legendLabel: "AI-flagged with no LGU feedback note",
    legendSwatchClass: "bg-rose-500",
    legendSwatchTestId: "citizen-project-status-legend-ai-flagged",
  },
  hasLguNote: {
    rowClass: "bg-amber-500 hover:bg-amber-600",
    cellTextClass: "text-slate-900",
    legendLabel: "Has LGU feedback note",
    legendSwatchClass: "bg-amber-500",
    legendSwatchTestId: "citizen-project-status-legend-lgu-note",
  },
  noIssues: {
    rowClass: "bg-white hover:bg-slate-50",
    cellTextClass: "text-slate-700",
    legendLabel: "No issues detected",
    legendSwatchClass: "bg-white border border-slate-400",
    legendSwatchTestId: "citizen-project-status-legend-no-issues",
  },
};

const CITIZEN_PROJECT_LEGEND_ORDER: CitizenProjectStatus[] = [
  "aiFlaggedNoLguNote",
  "hasLguNote",
  "noIssues",
];

function getCitizenProjectStatus(row: AipDetails["projectRows"][number]): CitizenProjectStatus {
  if (row.hasLguNote) return "hasLguNote";
  if (row.hasAiIssues) return "aiFlaggedNoLguNote";
  return "noIssues";
}

export default function AipProjectsTable({ aip }: { aip: AipDetails }) {
  const router = useRouter();
  const [activeSector, setActiveSector] = useState<AipProjectSector>('General Sector');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const unresolvedAiCount = useMemo(
    () =>
      aip.projectRows.filter((row) => row.hasAiIssues && !row.hasLguNote).length,
    [aip.projectRows]
  );

  const filteredRows = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return aip.projectRows
      .filter((row) => row.sector === activeSector)
      .filter((row) => {
        if (!loweredQuery) return true;
        return (
          row.projectRefCode.toLowerCase().includes(loweredQuery) ||
          row.programDescription.toLowerCase().includes(loweredQuery)
        );
      });
  }, [aip.projectRows, activeSector, query]);

  useEffect(() => {
    setOffset(0);
  }, [activeSector, query]);

  const maxOffset = useMemo(() => {
    if (filteredRows.length <= PAGE_SIZE) return 0;
    return Math.floor((filteredRows.length - 1) / PAGE_SIZE) * PAGE_SIZE;
  }, [filteredRows.length]);

  useEffect(() => {
    setOffset((current) => Math.min(current, maxOffset));
  }, [maxOffset]);

  const visibleRows = useMemo(
    () => filteredRows.slice(offset, offset + PAGE_SIZE),
    [filteredRows, offset]
  );

  const showingStart = filteredRows.length === 0 ? 0 : offset + 1;
  const showingEnd = filteredRows.length === 0 ? 0 : Math.min(offset + PAGE_SIZE, filteredRows.length);
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < filteredRows.length;

  return (
    <Card data-testid="citizen-aip-projects-table" className="border-slate-200">
      <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <CardTitle className="text-xl text-slate-900 sm:text-2xl">{aip.title} Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Tabs value={activeSector} onValueChange={(value) => setActiveSector(value as AipProjectSector)}>
            <div className="overflow-x-auto pb-1">
            <TabsList className="h-8 min-w-max gap-1.5 rounded-full bg-slate-100 p-1">
              {SECTOR_TABS.map((sector) => (
                <TabsTrigger
                  key={sector}
                  value={sector}
                  className="h-6 rounded-full px-2.5 text-[11px] sm:px-3 sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {sector}
                </TabsTrigger>
              ))}
            </TabsList>
            </div>
          </Tabs>

          <div className="w-full md:w-[280px]">
            <label className="text-xs text-slate-600">Search Projects</label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by project name or keyword"
                className="h-9 bg-white pl-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <CircleHelp className="h-3.5 w-3.5" />
          Tip: Select a row to view the project&apos;s full details.
        </div>

        {unresolvedAiCount > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Notice: {unresolvedAiCount} AI-flagged project(s) in this AIP have not been
            addressed by an LGU feedback note yet.
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-700">AIP Reference Code</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Program Description</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => {
                const status = getCitizenProjectStatus(row);
                const statusStyle = CITIZEN_PROJECT_STATUS_STYLES[status];

                return (
                  <TableRow
                    key={row.id}
                    className={`cursor-pointer ${statusStyle.rowClass}`}
                    onClick={() => {
                      router.push(`/aips/${encodeURIComponent(aip.id)}/${encodeURIComponent(row.id)}`);
                    }}
                  >
                    <TableCell className={`text-sm ${statusStyle.cellTextClass} break-words`}>
                      {row.projectRefCode}
                    </TableCell>
                    <TableCell className={`text-sm ${statusStyle.cellTextClass} break-words`}>
                      {row.programDescription}
                    </TableCell>
                    <TableCell className={`text-right text-sm ${statusStyle.cellTextClass} whitespace-nowrap`}>
                      {formatCurrency(row.totalAmount)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {visibleRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-slate-500">
                    No projects found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600 sm:text-sm">
            Showing {showingStart}-{showingEnd} of {filteredRows.length} projects
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
              disabled={!canGoPrev}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOffset((current) => Math.min(maxOffset, current + PAGE_SIZE))}
              disabled={!canGoNext}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-600 sm:justify-end sm:gap-5 sm:pt-2 sm:text-xs">
          {CITIZEN_PROJECT_LEGEND_ORDER.map((status) => {
            const style = CITIZEN_PROJECT_STATUS_STYLES[status];
            return (
              <div key={status} className="inline-flex items-center gap-2">
                <span
                  data-testid={style.legendSwatchTestId}
                  className={`inline-block h-3.5 w-3.5 rounded-sm ${style.legendSwatchClass}`}
                  aria-hidden="true"
                />
                {style.legendLabel}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
