import { Loader2 } from "lucide-react";

export default function CitizenChatLoadingMessage() {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[72%] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Loader2 className="h-4 w-4 animate-spin text-[#022437]" />
          Searching AIP documents...
        </div>
        <p className="mt-1 text-xs text-slate-500">Checking published AIPs for your scope...</p>
      </div>
    </div>
  );
}
