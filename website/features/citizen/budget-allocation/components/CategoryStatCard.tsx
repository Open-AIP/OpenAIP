'use client';

import { format as formatDate } from 'date-fns';
import { formatBudgetPHP } from '../utils';

export default function CategoryStatCard({
  category,
  budget,
  projects,
  index,
}: {
  category: string;
  budget: number;
  projects: number;
  index?: number;
}) {
  const colorVariants = [
    { bg: 'bg-gradient-to-br from-sky-100 to-sky-50', text: 'text-steelblue' },
    { bg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', text: 'text-mediumspringgreen' },
    { bg: 'bg-gradient-to-br from-yellow-100 to-yellow-50', text: 'text-goldenrod' },
    { bg: 'bg-gradient-to-br from-gray-100 to-gray-50', text: 'text-slate-400' },
  ];

  const variant = colorVariants[index ?? 0] ?? colorVariants[0];

  return (
    <div className={`rounded-2xl ${variant.bg} border border-slate-200 p-6 w-full md:w-64`}> 
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm text-slate-600">{category}</div>
          <div className={`mt-3 text-2xl font-bold ${variant.text}`}>{formatBudgetPHP(budget)}</div>
          <div className="mt-2 text-xs text-slate-600">Projects<br/><span className="text-2xl font-semibold text-slate-900">{projects}</span></div>
        </div>
      </div>
    </div>
  );
}
