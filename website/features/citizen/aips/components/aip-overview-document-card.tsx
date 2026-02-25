import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AipDetails } from '@/features/citizen/aips/types';

export default function AipOverviewDocumentCard({ aip }: { aip: AipDetails }) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl">
          <FileText className="h-5 w-5 text-slate-600" />
          {aip.title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-10">
          <div className="flex min-h-[170px] flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-12 w-12 text-slate-400" />
            <p className="text-base text-slate-600">{aip.pdfFilename}</p>
            <Button variant="outline">View PDF</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
