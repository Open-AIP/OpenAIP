import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CitizenChatComposerMode } from "../types/citizen-chatbot.types";

export default function CitizenChatComposer({
  mode,
  value,
  isSending,
  placeholder,
  disabled,
  onChange,
  onPrimaryAction,
}: {
  mode: CitizenChatComposerMode;
  value: string;
  isSending: boolean;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onPrimaryAction: () => void;
}) {
  const isSendMode = mode === "send";
  const primaryLabel =
    mode === "sign_in" ? "Sign In" : mode === "complete_profile" ? "Complete Profile" : "Send";

  return (
    <div className="sticky bottom-0 bg-inherit px-6 py-4 backdrop-blur">
      <div className="rounded-2xl bg-white p-3">
        <div className="flex items-end gap-3">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (!isSendMode) return;
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onPrimaryAction();
              }
            }}
            placeholder={placeholder}
            disabled={!isSendMode || disabled}
            className="min-h-11 max-h-32 resize-none border-0 px-2 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            className="h-10 rounded-xl bg-[#022437] px-4 text-white hover:bg-[#011c2a]"
            onClick={onPrimaryAction}
            disabled={isSendMode ? disabled || !value.trim().length : disabled}
          >
            {isSendMode ? <SendHorizonal className="mr-2 h-4 w-4" /> : null}
            {primaryLabel}
          </Button>
        </div>
      </div>
      <p className="mt-2 px-1 text-[11px] text-slate-500">
        {isSendMode ? "Shift+Enter for new line" : isSending ? "Please wait..." : "Authentication required"}
      </p>
    </div>
  );
}
