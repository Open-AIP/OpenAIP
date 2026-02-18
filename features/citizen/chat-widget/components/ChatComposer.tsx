import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatComposerVM } from "@/lib/types/viewmodels";

export default function ChatComposer({
  vm,
  onChange,
  onSend,
  disabled,
}: {
  vm: ChatComposerVM;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={vm.inputText}
          onChange={(event) => onChange(event.target.value)}
          placeholder={vm.placeholder}
          className="min-h-[44px] resize-none border-slate-200 bg-slate-50 text-[12px]"
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (vm.canSend && !disabled) {
                onSend();
              }
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 rounded-full bg-[#0b5164] text-white hover:bg-[#0b5164]/90"
          onClick={onSend}
          disabled={!vm.canSend || disabled}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
