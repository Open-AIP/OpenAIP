"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FeedbackModerationTab = "feedback" | "updates";

export default function FeedbackModerationTabs({
  value,
  onChange,
}: {
  value: FeedbackModerationTab;
  onChange: (tab: FeedbackModerationTab) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as FeedbackModerationTab)}>
      <TabsList className="h-12 w-full justify-start gap-6 rounded-none bg-transparent p-0 border-b border-slate-200">
        <TabsTrigger
          value="feedback"
          className="flex-none h-12 rounded-none px-6 text-[15px] font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          Feedback
        </TabsTrigger>
        <TabsTrigger
          value="updates"
          className="flex-none h-12 rounded-none px-6 text-[15px] font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          Projects Updates & Media
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

