'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AipDetails } from '@/features/citizen/aips/types';
import AipAccountabilityCard from '@/features/citizen/aips/components/AipAccountabilityCard';
import AipCommentsTab from '@/features/citizen/aips/components/AipCommentsTab';
import AipOverviewDocumentCard from '@/features/citizen/aips/components/AipOverviewDocumentCard';
import AipProjectsTable from '@/features/citizen/aips/components/AipProjectsTable';
import AipSummaryCard from '@/features/citizen/aips/components/AipSummaryCard';

export default function AipDetailsTabs({ aip }: { aip: AipDetails }) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="h-10 rounded-full bg-slate-200 p-1">
        <TabsTrigger
          value="overview"
          className="h-8 rounded-full px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="accountability"
          className="h-8 rounded-full px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Accountability
        </TabsTrigger>
        <TabsTrigger
          value="comments"
          className="h-8 rounded-full px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Comments ({aip.placeholderComments.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <AipOverviewDocumentCard aip={aip} />
        <AipSummaryCard aip={aip} />
        <AipProjectsTable aip={aip} />
      </TabsContent>

      <TabsContent value="accountability">
        <AipAccountabilityCard accountability={aip.accountability} />
      </TabsContent>

      <TabsContent value="comments">
        <AipCommentsTab comments={aip.placeholderComments} />
      </TabsContent>
    </Tabs>
  );
}
