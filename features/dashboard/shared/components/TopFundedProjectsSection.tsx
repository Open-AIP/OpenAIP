import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelectOption, TopProjectRowVM, TopProjectsFiltersVM } from "../types";
import TopProjectsFilters from "./TopProjectsFilters";
import TopProjectsTable from "./TopProjectsTable";

type TopFundedProjectsSectionProps = {
  rows: TopProjectRowVM[];
  filters: TopProjectsFiltersVM;
  categoryOptions: SelectOption[];
  typeOptions: SelectOption[];
  onFilterChange: (change: { category?: string; type?: string; search?: string }) => void;
};

export default function TopFundedProjectsSection({
  rows,
  filters,
  categoryOptions,
  typeOptions,
  onFilterChange,
}: TopFundedProjectsSectionProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Top Funded Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <TopProjectsFilters
          filters={filters}
          categoryOptions={categoryOptions}
          typeOptions={typeOptions}
          onFilterChange={onFilterChange}
        />
        <TopProjectsTable rows={rows} />
      </CardContent>
    </Card>
  );
}
