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
    userPrompt:
      vm?.userPrompt ??
      "Where is our barangay/city budget going this year? What are the biggest projects?",
    assistantIntro:
      vm?.assistantIntro ??
      "Based on the published AIP, here is the summary of where the budget is going this year, including the total AIP budget, and the biggest projects with their amounts, fund source, timeline, and implementing office:",
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
