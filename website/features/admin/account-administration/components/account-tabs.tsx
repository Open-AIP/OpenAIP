"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AccountTab } from "@/lib/repos/accounts/repo";

export default function AccountTabs({
  value,
  onChange,
}: {
  value: AccountTab;
  onChange: (tab: AccountTab) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as AccountTab)}>
      <TabsList className="h-12 w-full justify-start gap-6 rounded-none bg-transparent p-0 border-b border-slate-200">
        <TabsTrigger
          value="officials"
          className="flex-none h-12 rounded-none px-6 text-sm font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          Officials
        </TabsTrigger>
        <TabsTrigger
          value="citizens"
          className="flex-none h-12 rounded-none px-6 text-sm font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          Citizens
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
