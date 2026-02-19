"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FeedbackFiltersRow({
  query,
  onQueryChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  lguFilter,
  onLguChange,
  categoryOptions,
  statusOptions,
  lguOptions,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  lguFilter: string;
  onLguChange: (value: string) => void;
  categoryOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  lguOptions: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name or email"
            className="h-11 border-slate-200 bg-slate-50 pl-9 text-[13.5px]"
            aria-label="Search by name or email"
          />
        </div>

        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50 text-[13.5px]">
            <SelectValue placeholder="All Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50 text-[13.5px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={lguFilter} onValueChange={onLguChange}>
          <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50 text-[13.5px]">
            <SelectValue placeholder="All LGUs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All LGUs</SelectItem>
            {lguOptions.map((lgu) => (
              <SelectItem key={lgu} value={lgu}>
                {lgu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

