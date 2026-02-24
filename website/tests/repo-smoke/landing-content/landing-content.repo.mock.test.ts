import { createMockLandingContentRepo } from "@/lib/repos/landing-content/repo.mock";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runLandingContentRepoMockTests() {
  const repo = createMockLandingContentRepo();
  const vm = await repo.getLandingContent();

  assert(!!vm.hero?.title, "Expected hero title");
  assert(!!vm.manifesto?.lines?.length, "Expected manifesto lines");
  assert(!!vm.lguOverview?.lguName, "Expected LGU overview");
  assert(vm.distribution.sectors.length >= 4, "Expected at least 4 sector rows");
  assert(!!vm.healthHighlights.primaryKpiLabel, "Expected health primary KPI label");
  assert(vm.healthHighlights.primaryKpiValue > 0, "Expected health primary KPI value");
  assert(
    vm.healthHighlights.projects.every((project) => project.imageSrc.startsWith("/citizen-dashboard/")),
    "Expected health projects imageSrc to use citizen dashboard assets"
  );
  assert(vm.healthHighlights.projects.length >= 5, "Expected at least 5 health projects");
  assert(!!vm.infraHighlights.primaryKpiLabel, "Expected infrastructure primary KPI label");
  assert(vm.infraHighlights.primaryKpiValue > 0, "Expected infrastructure primary KPI value");
  assert(
    vm.infraHighlights.projects.every((project) => project.imageSrc.startsWith("/citizen-dashboard/")),
    "Expected infrastructure projects imageSrc to use citizen dashboard assets"
  );
  assert(vm.infraHighlights.projects.length >= 5, "Expected at least 5 infrastructure projects");
  assert(vm.feedback.months.length === 6, "Expected exactly 6 feedback month labels");
  assert(vm.feedback.series.length === 2, "Expected exactly 2 feedback series");
  assert(
    vm.feedback.series.every((series) => series.points.length === 6),
    "Expected each feedback series to contain exactly 6 points"
  );
  assert(vm.feedback.responseRate === 94, "Expected feedback response rate to be 94");
  assert(vm.feedback.avgResponseTimeDays === 2.3, "Expected average response time to be 2.3 days");
  assert(vm.chatPreview.suggestedPrompts.length >= 3, "Expected at least 3 suggested prompts");
}
