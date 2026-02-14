'use client';

import { useMemo, useState } from 'react';
import CitizenSectionBanner from "@/features/citizen/components/CitizenSectionBanner";
import AipFiltersBar from '@/features/citizen/aips/components/AipFiltersBar';
import AipIntroCard from '@/features/citizen/aips/components/AipIntroCard';
import AipListCard from '@/features/citizen/aips/components/AipListCard';
import { FISCAL_YEAR_OPTIONS, LGU_OPTIONS, getCitizenAipList } from '@/features/citizen/aips/data/aips.data';

const CitizenAipsPage = () => {
  const [selectedYear, setSelectedYear] = useState(FISCAL_YEAR_OPTIONS[0] ?? '2026');
  const [selectedLgu, setSelectedLgu] = useState('All LGUs');
  const [searchQuery, setSearchQuery] = useState('');

  const listItems = getCitizenAipList();

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
        fiscalYearOptions={FISCAL_YEAR_OPTIONS}
        lguOptions={LGU_OPTIONS}
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
