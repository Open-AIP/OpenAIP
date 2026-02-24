import Link from "next/link";
import { Bot, MessageCircle } from "lucide-react";
import type { ChatPreviewVM } from "@/lib/domain/landing-content";
import { cn } from "@/ui/utils";

type ChatPreviewCardProps = {
  vm: ChatPreviewVM;
  className?: string;
};

type LegacyChatPreviewShape = Partial<{
  sampleQuestion: string;
  sampleAnswerLines: string[];
}>;

function renderAssistantIntro(text: string) {
  const amountPattern = /(\u20B1[\d,.]+(?:\s?[MBK])?)/;
  const match = text.match(amountPattern);

  if (!match || !match[0]) {
    return <p className="text-sm text-slate-700">{text}</p>;
  }

  const amount = match[0];
  const amountStart = text.indexOf(amount);
  const before = text.slice(0, amountStart);
  const after = text.slice(amountStart + amount.length);

  return (
    <p className="text-sm text-slate-700">
      {before}
      <span className="font-semibold text-cyan-600">{amount}</span>
      {after}
    </p>
  );
}

export default function ChatPreviewCard({ vm, className }: ChatPreviewCardProps) {
  const legacyVm = vm as ChatPreviewVM & LegacyChatPreviewShape;
  const assistantBullets = Array.isArray(vm.assistantBullets)
    ? vm.assistantBullets
    : Array.isArray(legacyVm.sampleAnswerLines)
      ? legacyVm.sampleAnswerLines
      : [];
  const suggestedPrompts = Array.isArray(vm.suggestedPrompts) ? vm.suggestedPrompts : [];
  const userPrompt =
    typeof vm.userPrompt === "string" && vm.userPrompt.trim().length > 0
      ? vm.userPrompt
      : legacyVm.sampleQuestion ?? "";
  const assistantIntro =
    typeof vm.assistantIntro === "string" && vm.assistantIntro.trim().length > 0
      ? vm.assistantIntro
      : "Road projects received \u20B112M in total. This covers:";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-[#e8edf1] shadow-[0_0_24px_rgba(34,211,238,0.12),0_16px_42px_rgba(1,21,33,0.35)]",
        className
      )}
      aria-label={`${vm.assistantName} preview`}
    >
      <header className="bg-gradient-to-r from-[#0d5b71] via-[#0f8daa] to-[#0b7490] px-5 py-4 text-white">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-none">{vm.assistantName}</p>
            <p className="text-xs text-white/80">{vm.assistantStatus}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex justify-end">
          <p className="max-w-[88%] rounded-2xl bg-[#0b5a70] px-4 py-2.5 text-sm text-white">
            {userPrompt}
          </p>
        </div>

        <div className="max-w-[88%] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.07)]">
          {renderAssistantIntro(assistantIntro)}
          <ul className="mt-2 space-y-1.5 pl-4 text-sm text-slate-500">
            {assistantBullets.map((bullet) => (
              <li key={bullet} className="list-disc marker:text-slate-400">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-y border-slate-200 bg-[#f5f7fa] px-4 py-4 sm:px-5">
        <p className="mb-2 text-sm text-slate-500">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-200"
              aria-label={`Suggested prompt: ${prompt}`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-gradient-to-r from-[#0a5166] via-[#0a6f88] to-[#0a8bac] px-5 py-5">
        {vm.ctaHref ? (
          <Link
            href={vm.ctaHref}
            aria-label={vm.ctaLabel}
            className="mx-auto flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-3xl font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
          >
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
            <span>{vm.ctaLabel}</span>
          </Link>
        ) : (
          // TODO: Wire CTA click behavior when chat route is available.
          <button
            type="button"
            aria-label={vm.ctaLabel}
            className="mx-auto flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-3xl font-semibold text-white/90"
            disabled
          >
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
            <span>{vm.ctaLabel}</span>
          </button>
        )}
      </footer>
    </article>
  );
}
