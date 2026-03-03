'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AipDetails } from '@/features/citizen/aips/types';
import AipAccountabilityCard from '@/features/citizen/aips/components/aip-accountability-card';
import AipFeedbackTab from '@/features/citizen/aips/components/aip-feedback-tab';
import AipOverviewDocumentCard from '@/features/citizen/aips/components/aip-overview-document-card';
import AipProjectsTable from '@/features/citizen/aips/components/aip-projects-table';
import AipSummaryCard from '@/features/citizen/aips/components/aip-summary-card';

function readSearchParam(
  searchParams: ReturnType<typeof useSearchParams>,
  key: string
): string | null {
  if (typeof (searchParams as { get?: unknown })?.get === "function") {
    return (searchParams as { get(name: string): string | null }).get(key);
  }

  const rawQuery =
    typeof (searchParams as { toString?: unknown })?.toString === "function"
      ? (searchParams as { toString(): string }).toString()
      : "";
  if (!rawQuery) return null;
  return new URLSearchParams(rawQuery).get(key);
}

export default function AipDetailsTabs({ aip }: { aip: AipDetails }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = readSearchParam(searchParams, "tab");
  const activeTab =
    tabParam === "feedback" || tabParam === "accountability" ? tabParam : "overview";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "feedback") {
          params.set("tab", "feedback");
        } else if (value === "accountability") {
          params.set("tab", "accountability");
          params.delete("thread");
          params.delete("comment");
        } else {
          params.delete("tab");
          params.delete("thread");
          params.delete("comment");
        }

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }}
      className="space-y-6"
    >
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
          Feedback ({aip.feedbackCount})
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
        <AipFeedbackTab aipId={aip.id} feedbackCount={aip.feedbackCount} />
      </TabsContent>
    </Tabs>
  );
}
