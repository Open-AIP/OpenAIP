"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PlatformControlsTab = "feedback" | "chatbot";

export default function PlatformControlsTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: PlatformControlsTab;
  onTabChange: (value: PlatformControlsTab) => void;
}) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PlatformControlsTab)}>
      <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent p-0">
        <TabsTrigger
          value="feedback"
          className="rounded-none border-b-2 border-transparent px-4 py-2 text-[15px] text-slate-500 data-[state=active]:border-[#0E5D6F] data-[state=active]:text-slate-900"
        >
          Feedback Control
        </TabsTrigger>
        <TabsTrigger
          value="chatbot"
          className="rounded-none border-b-2 border-transparent px-4 py-2 text-[15px] text-slate-500 data-[state=active]:border-[#0E5D6F] data-[state=active]:text-slate-900"
        >
          Chatbot Control
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
