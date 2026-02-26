'use client';

import { useMemo, useState } from 'react';
import AipListCard from '@/features/citizen/aips/components/aip-list-card';
import CitizenExplainerCard from '@/features/citizen/components/citizen-explainer-card';
import CitizenFiltersBar from '@/features/citizen/components/citizen-filters-bar';
import CitizenPageHero from '@/features/citizen/components/citizen-page-hero';
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
      <CitizenPageHero
        title="Annual Investment Plans"
        subtitle="Explore how your city or barangay plans to use public funds for programs, projects, and community development throughout the year."
      />

      <CitizenExplainerCard title="What is an Annual Investment Plan?">
        <>
          <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
            The AIP is your local government&apos;s official roadmap for the year. It lists planned programs,
            projects, and activities, together with their approved budgets.
          </p>
          <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
            This page allows citizens to review the full document, understand budget priorities, and see how public
            funds are intended to benefit the community.
          </p>
          <p className="text-sm bg-orange-100 rounded-2xl p-2 text-slate">
            Click &quot;View Details&quot; on any AIP to see the complete breakdown of projects, budgets, timelines,
            and implementation strategies.
          </p>
        </>
      </CitizenExplainerCard>

      <CitizenFiltersBar
        yearOptions={FISCAL_YEAR_OPTIONS}
        yearValue={selectedYear}
        onYearChange={setSelectedYear}
        lguOptions={LGU_OPTIONS}
        lguValue={selectedLgu}
        onLguChange={setSelectedLgu}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search AIPs..."
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
      </div>
    </section>
  );
};

export default CitizenAipsPage;
