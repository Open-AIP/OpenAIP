"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AipMonitoringTab = "aips" | "cases";

export default function AipMonitoringTabs({
  value,
  onChange,
  casesCount,
}: {
  value: AipMonitoringTab;
  onChange: (tab: AipMonitoringTab) => void;
  casesCount: number;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as AipMonitoringTab)}>
      <TabsList className="h-12 w-full justify-start gap-6 rounded-none bg-transparent p-0 border-b border-slate-200">
        <TabsTrigger
          value="aips"
          className="flex-none h-12 rounded-none px-6 text-[15px] font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          AIPs
        </TabsTrigger>
        <TabsTrigger
          value="cases"
          className="flex-none h-12 rounded-none px-6 text-[15px] font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          Cases ({casesCount})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
