import { LandingContentView } from "@/features/citizen/landing-content";
import { getLandingContentRepo } from "@/lib/repos/landing-content";

const CitizenDashboardPage = async () => {
  const repo = getLandingContentRepo();
  const vm = await repo.getLandingContent();

  return (
    <div className="-mx-4 -my-6 md:-mx-8 md:-my-8">
      <LandingContentView vm={vm} />
    </div>
  );
};

export default CitizenDashboardPage;
