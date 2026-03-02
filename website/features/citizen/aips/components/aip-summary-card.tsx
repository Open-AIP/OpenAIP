import { Card, CardContent } from '@/components/ui/card';
import type { AipDetails } from '@/features/citizen/aips/types';

export default function AipSummaryCard({ aip }: { aip: AipDetails }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Summary</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700">{aip.summaryText}</p>
        </div>
      </CardContent>
    </Card>
  );
}
