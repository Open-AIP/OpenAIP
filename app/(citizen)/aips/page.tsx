'use client';

import { useEffect, useMemo, useState } from 'react';
import CitizenSectionBanner from "@/features/citizen/components/CitizenSectionBanner";
import AipFiltersBar from '@/features/citizen/aips/components/AipFiltersBar';
import AipIntroCard from '@/features/citizen/aips/components/AipIntroCard';
import AipListCard from '@/features/citizen/aips/components/AipListCard';
import { getCitizenAipRepo } from '@/lib/repos/citizen-aips';
import type { AipListItem } from '@/features/citizen/aips/types';

const CitizenAipsPage = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLgu, setSelectedLgu] = useState('All LGUs');
  const [searchQuery, setSearchQuery] = useState('');

  const [listItems, setListItems] = useState<AipListItem[]>([]);
  const [fiscalYearOptions, setFiscalYearOptions] = useState<string[]>([]);
  const [lguOptions, setLguOptions] = useState<string[]>(['All LGUs']);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const repo = getCitizenAipRepo();
      const [items, fiscalYearOptions, lguOptions] = await Promise.all([
        repo.listAips(),
        repo.listFiscalYearOptions(),
        repo.listLguOptions(),
      ]);
      if (!active) return;
      setListItems(items);
      setFiscalYearOptions(fiscalYearOptions);
      setLguOptions(lguOptions);
      setSelectedYear((prev) => prev || fiscalYearOptions[0] || '2026');
      setSelectedLgu((prev) => prev || lguOptions[0] || 'All LGUs');
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredAips = useMemo(() => {
    const loweredQuery = searchQuery.trim().toLowerCase();

    return listItems.filter((item) => {
      const yearMatch = item.year === selectedYear;
      const lguMatch = selectedLgu === 'All LGUs' || item.lguName === selectedLgu;
      const searchMatch =
        !loweredQuery ||
        item.title.toLowerCase().includes(loweredQuery) ||
        item.description.toLowerCase().includes(loweredQuery) ||
        item.lguName.toLowerCase().includes(loweredQuery);

      return yearMatch && lguMatch && searchMatch;
    });
  }, [listItems, searchQuery, selectedLgu, selectedYear]);

  return (
    <section className="space-y-6">
      <CitizenSectionBanner />
      <div className='mx-30 space-y-10'>
      <AipIntroCard />

      <AipFiltersBar
        fiscalYear={selectedYear}
        onFiscalYearChange={setSelectedYear}
        lgu={selectedLgu}
        onLguChange={setSelectedLgu}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        fiscalYearOptions={fiscalYearOptions}
        lguOptions={lguOptions}
      />

      <p className="text-sm text-slate-500">Showing {filteredAips.length} result{filteredAips.length !== 1 ? 's' : ''}</p>

      <div className="space-y-4">
        {filteredAips.map((item) => (
          <AipListCard key={item.id} item={item} />
        ))}

        {filteredAips.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No AIPs matched the selected filters.
          </div>
        )}
      </div></div>
      
    </section>
  );
};

export default CitizenAipsPage;
