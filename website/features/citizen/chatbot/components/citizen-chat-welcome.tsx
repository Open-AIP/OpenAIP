import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CitizenChatWelcome({
  examples,
  onUseExample,
}: {
  examples: readonly string[];
  onUseExample: (value: string) => void;
}) {
  return (
    <div className="mx-auto mt-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#022437]/10 text-[#022437]">
        <Bot className="h-6 w-6" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">OpenAIP AI Assistant</p>
      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Welcome to the OpenAIP AI Assistant</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Ask about budgets, sector allocations, and projects. Responses are grounded in published Annual Investment Plan records only.
      </p>

      <p className="mt-6 text-sm font-semibold text-slate-700">Example Queries</p>
      <div className="mt-3 space-y-2">
        {examples.map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            className="h-auto w-full justify-start rounded-full border-slate-200 bg-white px-5 py-3 text-left text-sm text-slate-700 hover:border-[#022437]/30"
            onClick={() => onUseExample(example)}
          >
            {example}
          </Button>
        ))}
      </div>

      <p className="mt-5 text-xs text-slate-500">Tip: Try specifying fiscal year and scope for faster results.</p>
    </div>
  );
}
