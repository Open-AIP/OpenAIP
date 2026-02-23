import type { LandingContentVM } from "@/lib/domain/landing-content";
import {
  AiAssistantPreviewSection,
  FinalCtaSection,
  FundsDistributionSection,
  HealthProjectsSection,
  HeroSection,
  InfrastructureProjectsSection,
  LandingContentCanvas,
  LguBudgetOverviewSection,
  ManifestoSection,
  VoiceMattersSection,
} from "../components";

type LandingContentViewProps = {
  vm: LandingContentVM;
};

export default function LandingContentView({ vm }: LandingContentViewProps) {
  return (
    <LandingContentCanvas>
      <HeroSection vm={vm.hero} />
      <ManifestoSection vm={vm.manifesto} />
      <LguBudgetOverviewSection vm={vm.lguOverview} />
      <FundsDistributionSection vm={vm.distribution} />
      <HealthProjectsSection vm={vm.healthHighlights} />
      <InfrastructureProjectsSection vm={vm.infraHighlights} />
      <VoiceMattersSection vm={vm.feedback} />
      <AiAssistantPreviewSection vm={vm.chatPreview} />
      <FinalCtaSection vm={vm.finalCta} />
    </LandingContentCanvas>
  );
}

