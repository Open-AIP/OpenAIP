import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BudgetAllocationFiltersVM, BudgetAllocationLguOptionVM } from "@/lib/domain/citizen-budget-allocation";

const optionValue = (option: BudgetAllocationLguOptionVM) => `${option.scopeType}:${option.id}`;

type FiltersSectionProps = {
  filters: BudgetAllocationFiltersVM;
  onYearChange: (year: number) => void;
  onLguChange: (scopeType: "city" | "barangay", scopeId: string) => void;
  onSearchChange: (value: string) => void;
};

export default function FiltersSection({ filters, onYearChange, onLguChange, onSearchChange }: FiltersSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4">
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-5 md:p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Filters</p>
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr_1.4fr]">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Fiscal Year</Label>
              <Select value={String(filters.selectedYear)} onValueChange={(value) => onYearChange(Number(value))}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 focus-visible:ring-cyan-500/40">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {filters.availableYears.map((year: number) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500">LGU</Label>
              <Select
                value={`${filters.selectedScopeType}:${filters.selectedScopeId}`}
                onValueChange={(value) => {
                  const [scopeType, scopeId] = value.split(":");
                  onLguChange(scopeType === "barangay" ? "barangay" : "city", scopeId ?? "");
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 focus-visible:ring-cyan-500/40">
                  <SelectValue placeholder="Select LGU" />
                </SelectTrigger>
                <SelectContent>
                  {filters.availableLGUs.map((option: BudgetAllocationLguOptionVM) => (
                    <SelectItem key={optionValue(option)} value={optionValue(option)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filters.searchText}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search sector or project..."
                  className="h-10 rounded-xl border-slate-200 pl-9 focus-visible:ring-cyan-500/40"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
