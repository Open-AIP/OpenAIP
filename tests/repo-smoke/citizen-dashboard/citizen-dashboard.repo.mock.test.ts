import { createMockCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard/repo.mock";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCitizenDashboardRepoTests() {
  const repo = createMockCitizenDashboardRepo();

  const result = await repo.getDashboard({
    scope_type: "city",
    scope_id: "city_001",
    fiscal_year: 2026,
    search: "",
  });

  assert(result.publishedAips.length > 0, "Expected published AIPs in citizen dashboard repo");
  assert(
    result.publishedAips.every((aip) => aip.status === "published"),
    "Expected published-only AIP records"
  );

  const publishedAipIds = new Set(result.publishedAips.map((aip) => aip.id));
  assert(
    result.projects.every((project) => publishedAipIds.has(project.aip_id)),
    "Expected projects to belong to published AIPs only"
  );

  const resolvedYearResult = await repo.getDashboard({
    scope_type: "city",
    scope_id: "city_001",
    fiscal_year: 1900,
    search: "  ",
  });

  assert(
    resolvedYearResult.resolvedFilters.fiscal_year >= 2000,
    "Expected invalid fiscal year to resolve to available fiscal year"
  );
  assert(
    resolvedYearResult.resolvedFilters.search === "",
    "Expected search text to be normalized"
  );
}

