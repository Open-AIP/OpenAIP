"use client";

import { FileSearch } from "lucide-react";

export default function ChatAssistantLoadingState() {
  return (
    <div className="flex w-full justify-start">
      <div className="w-full max-w-[360px] rounded-2xl bg-[#E8ECEF] px-5 py-4 text-[#1E3A4A] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9E7ED] text-[#0E7490]">
            <FileSearch className="h-5 w-5" />
          </div>
          <p className="text-[20px] font-semibold leading-tight tracking-tight">
            Searching AIP documents...
          </p>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-[#D0D8DE]">
          <div className="h-full w-[92%] animate-pulse rounded-full bg-[#0E7490]" />
        </div>

        <div className="mt-4 flex items-center gap-3 text-[#7A8791]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#9AA6AF]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#9AA6AF] [animation-delay:120ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#9AA6AF] [animation-delay:240ms]" />
          </div>
          <span className="text-xs font-medium">OpenAIP AI Assistant</span>
        </div>
      </div>
    </div>
  );
}
