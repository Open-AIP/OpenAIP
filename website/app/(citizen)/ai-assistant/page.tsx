import { LguChatbotView } from "@/features/chat";
import CitizenExplainerCard from "@/features/citizen/components/citizen-explainer-card";
import CitizenPageHero from "@/features/citizen/components/citizen-page-hero";

const CitizenAiAssistantPage = () => {
  return (
    <section className="flex h-full min-h-0 flex-col gap-6">
      <CitizenPageHero
        title="AI Assistant"
        subtitle="Ask questions about AIPs, budget allocations, projects, and planning details with guided support."
        eyebrow="OpenAIP"
      />
      <CitizenExplainerCard title="How can the AI Assistant help?">
        <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
          Use this assistant to quickly understand plans, allocations, and project details. It helps summarize
          information and point you to relevant sections for follow-up.
        </p>
      </CitizenExplainerCard>
      <div className="min-h-0 flex-1">
        <LguChatbotView />
      </div>
    </section>
  );
};

export default CitizenAiAssistantPage;
