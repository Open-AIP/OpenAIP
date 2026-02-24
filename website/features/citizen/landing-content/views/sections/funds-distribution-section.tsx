import type { SectorDistributionVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";
import FundsDistributionMotion from "./funds-distribution-motion.client";

type FundsDistributionSectionProps = {
  vm: SectorDistributionVM;
};

export default function FundsDistributionSection({ vm }: FundsDistributionSectionProps) {
  return (
    <FullScreenSection id="funds-distribution" variant="dark" className="bg-[#001925]">
      <FundsDistributionMotion vm={vm} />
    </FullScreenSection>
  );
}
