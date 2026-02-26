import { Button } from "@/components/ui/button";
import type { CitizenChatFollowUp } from "../types/citizen-chatbot.types";

export default function CitizenChatFollowups({
  followUps,
  onUseFollowUp,
}: {
  followUps: CitizenChatFollowUp[];
  onUseFollowUp: (value: string) => void;
}) {
  if (!followUps.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {followUps.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant="outline"
          className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs text-slate-700 hover:border-[#022437]/40"
          onClick={() => onUseFollowUp(item.label)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
