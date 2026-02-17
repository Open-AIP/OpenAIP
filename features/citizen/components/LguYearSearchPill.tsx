'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableFiscalYears } from '@/features/shared/providers/yearOptions';

const PLACE_OPTIONS = [
  { value: 'city-of-cabuyao', label: 'City of Cabuyao' },
  { value: 'brgy-mamatid', label: 'Brgy. Mamatid' },
  { value: 'brgy-pulo', label: 'Brgy. Pulo' },
  { value: 'brgy-san-isidro', label: 'Brgy. San Isidro' },
  { value: 'brgy-banaybanay', label: 'Brgy. Banaybanay' },
];

export default function LguYearSearchPill() {
  const fiscalYearOptions = useMemo(() => getAvailableFiscalYears(), []);
  const [place, setPlace] = useState<string>(PLACE_OPTIONS[0].value);
  const [fiscalYear, setFiscalYear] = useState<string>(String(fiscalYearOptions[0] ?? new Date().getFullYear()));

  const selectedPlaceLabel = useMemo(
    () => PLACE_OPTIONS.find((option) => option.value === place)?.label ?? place,
    [place]
  );

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/30 bg-[#D3DBE0] p-3 shadow-lg md:rounded-full md:p-2">
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
            console.log({ place: selectedPlaceLabel, fiscalYear });
          }}
          className="h-10 bg-[#0E7490] px-6 text-white hover:bg-[#0C6078]"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
