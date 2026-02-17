"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SelectOption } from "../types";

type DashboardHeaderProps = {
  year: string | number;
  yearOptions: SelectOption[];
  onYearChange: (value: string | number) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export default function DashboardHeader({
  year,
  yearOptions,
  onYearChange,
  search,
  onSearchChange,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-[40px] leading-none font-semibold text-slate-900">Welcome to OpenAIP</h1>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 border-slate-200 bg-slate-50 pl-9"
            placeholder="Global search..."
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-slate-500">Year:</span>
          <Select value={String(year)} onValueChange={(value) => onYearChange(value)}>
            <SelectTrigger className="h-10 border-slate-200 bg-slate-50">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
