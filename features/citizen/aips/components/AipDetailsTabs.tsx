'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AipDetails, FeedbackItem, FeedbackUser } from '@/features/citizen/aips/types';
import AipAccountabilityCard from '@/features/citizen/aips/components/AipAccountabilityCard';
import AipFeedbackTab from '@/features/citizen/aips/components/AipFeedbackTab';
import AipOverviewDocumentCard from '@/features/citizen/aips/components/AipOverviewDocumentCard';
import AipProjectsTable from '@/features/citizen/aips/components/AipProjectsTable';
import AipSummaryCard from '@/features/citizen/aips/components/AipSummaryCard';

export default function AipDetailsTabs({
  aip,
  feedbackItems,
  isAuthenticated,
  currentUser,
}: {
  aip: AipDetails;
  feedbackItems: FeedbackItem[];
  isAuthenticated: boolean;
  currentUser?: FeedbackUser | null;
}) {
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
          value="feedback"
          className="h-8 rounded-full px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Feedback ({feedbackItems.length})
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

      <TabsContent value="feedback">
        <AipFeedbackTab
          aipId={aip.id}
          items={feedbackItems}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
        />
      </TabsContent>
    </Tabs>
  );
}
