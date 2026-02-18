import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPeso } from "@/lib/formatting";
import type { AipDetailsTableVM, BudgetCategoryKey } from "@/lib/types/viewmodels/citizen-budget-allocation.vm";

const tabValue = (key: BudgetCategoryKey) => key;

type AipDetailsSectionProps = {
  vm: AipDetailsTableVM;
  onTabChange: (key: BudgetCategoryKey) => void;
  onSearchChange: (value: string) => void;
  viewAllHref: string;
};

export default function AipDetailsSection({ vm, onTabChange, onSearchChange, viewAllHref }: AipDetailsSectionProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">{vm.title}</h3>
          <p className="text-xs text-slate-500">{vm.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={tabValue(vm.activeTab)} onValueChange={(value) => onTabChange(value as BudgetCategoryKey)}>
            <TabsList className="bg-slate-100">
              {vm.tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tabValue(tab.key)} className="text-xs">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={vm.searchText}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search projects"
              className="h-9 pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-600">AIP Reference Code</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Program Description</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vm.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-slate-500">
                    No projects match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                vm.rows.map((row) => (
                  <TableRow key={row.aipRefCode}>
                    <TableCell className="text-xs text-slate-700">{row.aipRefCode}</TableCell>
                    <TableCell className="text-xs text-slate-700">{row.programDescription}</TableCell>
                    <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                      {formatPeso(row.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <Button asChild variant="link" className="text-xs text-[#0b5188]">
            <Link href={viewAllHref}>View Full Details of AIP</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
