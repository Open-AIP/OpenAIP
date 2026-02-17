"use client";

import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  fiscalYears: number[];
  fiscalYearFilter: string;
  onFiscalYearChange: (value: string) => void;
  scopeOptions: string[];
  scopeFilter: string;
  onScopeChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
};

export default function ProjectFilters({
  fiscalYears,
  fiscalYearFilter,
  onFiscalYearChange,
  scopeOptions,
  scopeFilter,
  onScopeChange,
  query,
  onQueryChange,
}: Props) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="space-y-2 md:flex-1">
            <div className="text-xs text-slate-500">Fiscal Year</div>
            <Select value={fiscalYearFilter} onValueChange={onFiscalYearChange}>
              <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-200">
                <SelectValue placeholder="Fiscal Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {fiscalYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:flex-1">
            <div className="text-xs text-slate-500">LGU</div>
            <Select value={scopeFilter} onValueChange={onScopeChange}>
              <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select LGU" />
              </SelectTrigger>
              <SelectContent>
                {scopeOptions.map((lgu) => (
                  <SelectItem key={lgu} value={lgu}>
                    {lgu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:flex-1">
            <div className="text-xs text-slate-500">Search</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search projects..."
                className="h-10 w-full border-slate-200 bg-slate-50 pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
