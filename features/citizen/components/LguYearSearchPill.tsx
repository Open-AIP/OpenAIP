'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PLACE_OPTIONS = [
  { value: 'city-of-cabuyao', label: 'City of Cabuyao' },
  { value: 'brgy-mamatid', label: 'Brgy. Mamatid' },
  { value: 'brgy-pulo', label: 'Brgy. Pulo' },
  { value: 'brgy-san-isidro', label: 'Brgy. San Isidro' },
  { value: 'brgy-banaybanay', label: 'Brgy. Banaybanay' },
];

const YEAR_OPTIONS = ['2024', '2025', '2026'];

export default function LguYearSearchPill() {
  const [place, setPlace] = useState<string>(PLACE_OPTIONS[0].value);
  const [year, setYear] = useState<string>(YEAR_OPTIONS[2]);

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
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year-select" className="h-10 border-slate-200 bg-white">
              <SelectValue placeholder="Choose Year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={() => {
            console.log({ place: selectedPlaceLabel, year });
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
