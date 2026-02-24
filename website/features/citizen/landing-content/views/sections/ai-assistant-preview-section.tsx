import type { ChatPreviewVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";
import ChatPreviewCard from "./chat-preview-card";

type AiAssistantPreviewSectionProps = {
  vm?: ChatPreviewVM;
};

export default function AiAssistantPreviewSection({ vm }: AiAssistantPreviewSectionProps) {
  const safeVm: ChatPreviewVM = {
    pillLabel: vm?.pillLabel ?? "AI Assistant",
    title: vm?.title ?? "Ask Questions, Get Answers",
    subtitle:
      vm?.subtitle ??
      "Don't understand something? Just ask. Our AI chatbot can answer questions about budgets, projects, and programs.",
    assistantName: vm?.assistantName ?? "Budget Assistant",
    assistantStatus: vm?.assistantStatus ?? "Always ready to help",
    userPrompt: vm?.userPrompt ?? "How much budget went to road projects?",
    assistantIntro: vm?.assistantIntro ?? "Road projects received \u20B112M in total. This covers:",
    assistantBullets: Array.isArray(vm?.assistantBullets) ? vm.assistantBullets : [],
    suggestedPrompts: Array.isArray(vm?.suggestedPrompts) ? vm.suggestedPrompts : [],
    ctaLabel: vm?.ctaLabel ?? "Open Chatbot",
    ctaHref: vm?.ctaHref,
  };

  return (
    <FullScreenSection
      id="ai-assistant-preview"
      variant="dark"
      className="bg-[#00384B]"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        <header className="space-y-4 text-center">
          <p className="mx-auto inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold text-white/90">
            {safeVm.pillLabel}
          </p>
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">{safeVm.title}</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/70 sm:text-xl">{safeVm.subtitle}</p>
        </header>

        <ChatPreviewCard vm={safeVm} className="w-full max-w-4xl" />
      </div>
    </FullScreenSection>
  );
}
