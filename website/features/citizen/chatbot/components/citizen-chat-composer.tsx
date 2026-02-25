import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CitizenChatComposer({
  value,
  disabled,
  onChange,
  onSend,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="sticky bottom-0 border-t border-slate-200 bg-[#E9EEF2]/95 px-6 py-4 backdrop-blur">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-end gap-3">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask about budgets, sectors, or projects..."
            className="min-h-11 max-h-32 resize-none border-0 px-2 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            className="h-10 rounded-xl bg-[#022437] px-4 text-white hover:bg-[#011c2a]"
            onClick={onSend}
            disabled={disabled || !value.trim().length}
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
      <p className="mt-2 px-1 text-[11px] text-slate-500">Shift+Enter for new line</p>
    </div>
  );
}
