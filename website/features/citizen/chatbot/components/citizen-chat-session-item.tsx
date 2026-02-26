import { cn } from "@/ui/utils";
import type { CitizenChatSessionVM } from "../types/citizen-chatbot.types";

export default function CitizenChatSessionItem({
  session,
  onSelect,
}: {
  session: CitizenChatSessionVM;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={cn(
        "w-full border-l-4 border-transparent bg-white px-4 py-4 text-left transition-all hover:bg-slate-50",
        session.isActive && "border-l-[#022437] bg-[#f5f8fa]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{session.title}</h3>
        <span className="text-[11px] font-medium text-slate-500">{session.timeLabel}</span>
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-slate-600">{session.snippet}</p>
      <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
        {session.scopeBadge}
      </span>
    </button>
  );
}
