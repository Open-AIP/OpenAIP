import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { CitizenChatScopeChip } from "../types/citizen-chatbot.types";

export default function CitizenChatHeader({
  scopeChips,
  sourcesEnabled,
  onToggleSources,
}: {
  scopeChips: CitizenChatScopeChip[];
  sourcesEnabled: boolean;
  onToggleSources: (value: boolean) => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-[#E9EEF2]/95 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[30px] font-semibold tracking-tight text-slate-900">OpenAIP AI Assistant</h2>
          <p className="mt-1 text-sm text-slate-600">Answers are based only on published AIP documents.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <span className="text-xs font-medium text-slate-600">Sources</span>
            <Switch checked={sourcesEnabled} onCheckedChange={onToggleSources} />
          </div>
          <Button variant="ghost" className="h-8 text-xs text-slate-600 hover:text-slate-900">
            Reset context
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {scopeChips.map((chip) => (
          <Badge
            key={chip.id}
            variant="secondary"
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
          >
            {chip.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
