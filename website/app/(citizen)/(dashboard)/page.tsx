import { LandingContentView } from "@/features/citizen/landing-content";
import { getLandingContentRepo } from "@/lib/repos/landing-content";

const CitizenDashboardPage = async () => {
  const repo = getLandingContentRepo();
  const vm = await repo.getLandingContent();

  return <LandingContentView vm={vm} />;
};

export default CitizenDashboardPage;
