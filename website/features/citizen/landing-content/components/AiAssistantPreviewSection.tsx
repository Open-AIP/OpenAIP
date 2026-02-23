import { CardContent } from "@/components/ui/card";
import type { ChatPreviewVM } from "@/lib/domain/landing-content";
import CardShell from "./CardShell";
import FullScreenSection from "./FullScreenSection";
import PrimaryButton from "./PrimaryButton";
import SectionHeader from "./SectionHeader";

type AiAssistantPreviewSectionProps = {
  vm: ChatPreviewVM;
};

export default function AiAssistantPreviewSection({ vm }: AiAssistantPreviewSectionProps) {
  return (
    <FullScreenSection id="ai-assistant-preview" variant="dark" className="bg-[#023246]">
      <div className="space-y-8">
        <SectionHeader
          align="center"
          eyebrow="AI Assistant"
          title="Ask Questions, Get Answers"
          subtitle="Use plain language to explore AIP details, budgets, and project priorities."
        />

        <CardShell className="mx-auto max-w-3xl border-white/20 bg-[#064B63] py-0 text-slate-100">
          <CardContent className="space-y-4 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8ED4E4]">{vm.assistantName}</p>

            <div className="ml-auto max-w-[80%] rounded-2xl bg-[#0B3A4D] px-4 py-3 text-sm text-slate-100">
              {vm.sampleQuestion}
            </div>

            <div className="max-w-[88%] rounded-2xl bg-white/95 px-4 py-3 text-sm text-[#123243]">
              {vm.sampleAnswerLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {vm.suggestedPrompts.map((prompt) => (
                <span key={prompt} className="rounded-full border border-[#89C7D7]/45 bg-[#0B3A4D] px-3 py-1 text-xs text-slate-100">
                  {prompt}
                </span>
              ))}
            </div>

            <PrimaryButton label="Open Chatbot" href="/chatbot" className="w-full" />
          </CardContent>
        </CardShell>
      </div>
    </FullScreenSection>
  );
}

