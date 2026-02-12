import { Card, CardContent } from '@/components/ui/card';
import type { AipDetails } from '@/features/citizen/aips/types';

export default function AipSummaryCard({ aip }: { aip: AipDetails }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-4xl font-semibold text-slate-900">Summary</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">{aip.summary}</p>
        </div>

        <div>
          <h3 className="text-4xl font-semibold text-slate-900">Detailed Description</h3>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">{aip.detailedDescriptionIntro}</p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-lg text-slate-700">
            {aip.detailedBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ol>

          <p className="mt-5 text-lg leading-relaxed text-slate-700">{aip.detailedClosing}</p>
        </div>
      </CardContent>
    </Card>
  );
}
