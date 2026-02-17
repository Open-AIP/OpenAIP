"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CitizenHero from '@/features/citizen/components/CitizenHero';
import type { CitizenActions } from '@/features/citizen/types/citizen-actions';

const CitizenDashboardPage = () => {
  const router = useRouter();

  const actions = useMemo<CitizenActions>(
    () => ({
      onSearch: ({ scope_type, scope_id, fiscal_year }) => {
        const params = new URLSearchParams();
        params.set('scope_type', scope_type);
        params.set('scope_id', scope_id);
        params.set('fiscal_year', String(fiscal_year));
        router.push(`/aips?${params.toString()}`);
      },
      onOpenDashboard: () => {
        router.push('/dashboard');
      },
      onBrowseAips: () => {
        router.push('/aips');
      },
      onOpenBudgetAllocation: () => {
        router.push('/budget-allocation');
      },
      onExploreProjects: ({ sector_code } = {}) => {
        const params = new URLSearchParams();
        if (sector_code) params.set('sector_code', sector_code);
        const query = params.toString();
        router.push(query ? `/projects?${query}` : '/projects');
      },
    }),
    [router]
  );

  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <h1 id="dashboard-title" className="sr-only">
        Dashboard
      </h1>
      <CitizenHero actions={actions} />
    </section>
  );
};

export default CitizenDashboardPage;
