'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableFiscalYears } from '@/features/shared/providers/yearOptions';
import type { CitizenActions } from '@/features/citizen/actions/citizen-actions';
import { CITIZEN_DASHBOARD_TOKENS } from '@/lib/ui/tokens';

const PLACE_OPTIONS = [
  { value: 'city_001', label: 'City of Cabuyao', scope_type: 'city' as const, scope_id: 'city_001' },
  { value: 'brgy_mamatid', label: 'Brgy. Mamatid', scope_type: 'barangay' as const, scope_id: 'brgy_mamatid' },
  { value: 'brgy_pulo', label: 'Brgy. Pulo', scope_type: 'barangay' as const, scope_id: 'brgy_pulo' },
  { value: 'brgy_san_isidro', label: 'Brgy. San Isidro', scope_type: 'barangay' as const, scope_id: 'brgy_san_isidro' },
  { value: 'brgy_banaybanay', label: 'Brgy. Banaybanay', scope_type: 'barangay' as const, scope_id: 'brgy_banaybanay' },
];

type LguYearSearchPillProps = {
  onSearch: CitizenActions['onSearch'];
};

export default function LguYearSearchPill({ onSearch }: LguYearSearchPillProps) {
  const fiscalYearOptions = useMemo(() => getAvailableFiscalYears(), []);
  const [place, setPlace] = useState<string>(PLACE_OPTIONS[0].value);
  const [fiscalYear, setFiscalYear] = useState<string>(String(fiscalYearOptions[0] ?? new Date().getFullYear()));

  const selectedPlace = useMemo(
    () => PLACE_OPTIONS.find((option) => option.value === place) ?? PLACE_OPTIONS[0],
    [place]
  );

  return (
    <div className={`w-full max-w-3xl rounded-2xl border border-white/30 ${CITIZEN_DASHBOARD_TOKENS.searchPillSurfaceClass} p-3 shadow-lg md:rounded-full md:p-2`}>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
        <div className="space-y-1">
          <Label htmlFor="place-select" className="sr-only">
            Choose Place
          </Label>
          <Select value={place} onValueChange={setPlace}>
            <SelectTrigger id="place-select" className="h-10 border-slate-200 bg-white">
              <SelectValue placeholder="Choose Place" />
            </SelectTrigger>
            <SelectContent>
              {PLACE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="year-select" className="sr-only">
            Choose Year
          </Label>
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
            <SelectTrigger id="year-select" className="h-10 border-slate-200 bg-white">
              <SelectValue placeholder="Choose Year" />
            </SelectTrigger>
            <SelectContent>
              {fiscalYearOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={() => {
            onSearch({
              scope_type: selectedPlace.scope_type,
              scope_id: selectedPlace.scope_id,
              fiscal_year: fiscalYear,
            });
          }}
          className={`h-10 px-6 ${CITIZEN_DASHBOARD_TOKENS.primaryButtonClass}`}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
