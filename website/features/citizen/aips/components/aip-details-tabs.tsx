'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AipDetails } from '@/features/citizen/aips/types';
import AipAccountabilityCard from '@/features/citizen/aips/components/aip-accountability-card';
import AipCommentsTab from '@/features/citizen/aips/components/aip-comments-tab';
import AipOverviewDocumentCard from '@/features/citizen/aips/components/aip-overview-document-card';
import AipProjectsTable from '@/features/citizen/aips/components/aip-projects-table';
import AipSummaryCard from '@/features/citizen/aips/components/aip-summary-card';

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
          Comments ({aip.feedbackCount})
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
        <AipCommentsTab aipId={aip.id} feedbackCount={aip.feedbackCount} />
      </TabsContent>
    </Tabs>
  );
}
