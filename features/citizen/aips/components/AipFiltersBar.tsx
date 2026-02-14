'use client';

import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  fiscalYear: string;
  onFiscalYearChange: (value: string) => void;
  lgu: string;
  onLguChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  fiscalYearOptions: string[];
  lguOptions: string[];
};

export default function AipFiltersBar({
  fiscalYear,
  onFiscalYearChange,
  lgu,
  onLguChange,
  search,
  onSearchChange,
  fiscalYearOptions,
  lguOptions,
}: Props) {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-4 p-4 md:p-6">
        <h3 className="text-sm font-medium text-slate-700">Filters</h3>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="space-y-1 md:flex-1">
            <label className="text-xs font-medium text-slate-600">Fiscal Year</label>
            <Select value={fiscalYear} onValueChange={onFiscalYearChange}>
              <SelectTrigger className="h-10 w-full bg-white">
                <SelectValue placeholder="Select fiscal year" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:flex-1">
            <label className="text-xs font-medium text-slate-600">LGU</label>
            <Select value={lgu} onValueChange={onLguChange}>
              <SelectTrigger className="h-10 w-full bg-white">
                <SelectValue placeholder="Select LGU" />
              </SelectTrigger>
              <SelectContent>
                {lguOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:flex-1">
            <label className="text-xs font-medium text-slate-600">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search AIPs..."
                className="h-10 w-full bg-white pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
