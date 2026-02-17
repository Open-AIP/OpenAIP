import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SelectOption, TopProjectsFiltersVM } from "../types";

type TopProjectsFiltersProps = {
  filters: TopProjectsFiltersVM;
  categoryOptions: SelectOption[];
  typeOptions: SelectOption[];
  onFilterChange: (change: { sector_code?: TopProjectsFiltersVM["sector_code"]; type?: string; search?: string }) => void;
};

export default function TopProjectsFilters({
  filters,
  categoryOptions,
  typeOptions,
  onFilterChange,
}: TopProjectsFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      <div className="relative xl:col-span-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={filters.search}
          onChange={(event) => onFilterChange({ search: event.target.value })}
          className="h-9 border-slate-200 bg-slate-50 pl-9"
          placeholder="Search projects..."
        />
      </div>

      <div className="xl:col-span-2">
        <Select
          value={filters.sector_code}
          onValueChange={(value) => onFilterChange({ sector_code: value as TopProjectsFiltersVM["sector_code"] })}
        >
          <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="xl:col-span-2">
        <Select value={filters.type} onValueChange={(value) => onFilterChange({ type: value })}>
          <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
