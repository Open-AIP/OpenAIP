import Link from 'next/link';
import { Calendar, FileText, Eye, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AipListItem } from '@/features/citizen/aips/types';
import { formatCurrency, formatPublishedDate } from '@/features/citizen/aips/data/aips.data';

export default function AipListCard({ item }: { item: AipListItem }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-[#0E7490]" />
              <div className="min-w-0">
                <h3 className="text-3xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-lg leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Fiscal Year {item.fiscalYear}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Published {formatPublishedDate(item.publishedAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                <WalletCards className="mr-1 h-3 w-3" />
                Budget: {formatCurrency(item.budgetTotal)}
              </Badge>
              <Badge className="bg-[#5ba6cb] text-white">{item.projectsCount} Projects</Badge>
            </div>
          </div>

          <div className="md:pl-6">
            <Button asChild className="bg-[#03455f] text-white hover:bg-[#02384d]">
              <Link href={`/aips/${item.id}`}>
                <Eye className="h-4 w-4" />
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
