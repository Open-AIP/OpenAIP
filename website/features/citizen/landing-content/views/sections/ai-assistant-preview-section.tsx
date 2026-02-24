import type { ChatPreviewVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";
import AiPreviewMotion from "./ai-preview-motion.client";

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
      <AiPreviewMotion vm={safeVm} />
    </FullScreenSection>
  );
}
