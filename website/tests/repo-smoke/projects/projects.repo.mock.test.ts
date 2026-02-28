import { createMockProjectsRepoImpl } from "@/lib/repos/projects/repo.mock";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runProjectRepoTests() {
  const repo = createMockProjectsRepoImpl();

  const health = await repo.getById("PROJ-H-2026-001");
  assert(health?.kind === "health", "Expected health project kind");

  const infra = await repo.getById("PROJ-I-2026-001");
  assert(infra?.kind === "infrastructure", "Expected infrastructure project kind");

  const other = await repo.getById("PROJ-O-2026-001");
  assert(other?.kind === "other", "Expected other project kind");

  const mamadidScope = { barangayScopeName: "Brgy. Mamadid" };
  const allowedHealth = await repo.getById("PROJ-H-2026-001", mamadidScope);
  assert(allowedHealth?.kind === "health", "Expected Mamadid to access own project");

  const blockedHealth = await repo.getById("PROJ-H-2026-002", mamadidScope);
  assert(blockedHealth === null, "Expected Mamadid to be blocked from non-owned project");

  const scopedHealthList = await repo.listHealth(mamadidScope);
  assert(scopedHealthList.length > 0, "Expected scoped health list to return owned projects");
  assert(
    scopedHealthList.length < (await repo.listHealth()).length,
    "Expected scoped health list to be narrower than unscoped list"
  );

  const unmatchedScope = { barangayScopeName: "Brgy. Unknown" };
  assert(
    (await repo.listInfrastructure(unmatchedScope)).length === 0,
    "Expected unmatched scope to return empty infrastructure list"
  );
  assert(
    (await repo.getById("PROJ-I-2026-001", unmatchedScope)) === null,
    "Expected unmatched scope to return null for direct project access"
  );

  const publishedHealth = await repo.listHealth({ publishedOnly: true });
  assert(publishedHealth.length === 4, "Expected only published-AIP health projects");

  const publishedInfra = await repo.listInfrastructure({ publishedOnly: true });
  assert(publishedInfra.length === 5, "Expected only published-AIP infrastructure projects");

  assert(
    (await repo.getById("PROJ-H-2026-001", { publishedOnly: true })) === null,
    "Expected non-published project to be hidden when publishedOnly is true"
  );
  assert(
    (await repo.getById("PROJ-H-2026-002", { publishedOnly: true }))?.kind === "health",
    "Expected published project to remain visible when publishedOnly is true"
  );

  const mamadidPublishedScope = {
    barangayScopeName: "Brgy. Mamadid",
    publishedOnly: true,
  };
  const mamadidPublishedHealth = await repo.listHealth(mamadidPublishedScope);
  assert(
    mamadidPublishedHealth.length === 2,
    "Expected scoped published-only health list to include only published Mamadid projects"
  );
  assert(
    (await repo.getById("PROJ-H-2026-001", mamadidPublishedScope)) === null,
    "Expected scoped published-only reads to hide non-published owned projects"
  );
  assert(
    (await repo.getById("PROJ-H-2025-001", mamadidPublishedScope))?.kind === "health",
    "Expected scoped published-only reads to include published owned projects"
  );

  assert(
    (await repo.listHealth({ barangayId: "some-id", publishedOnly: true })).length === 0,
    "Expected malformed scoped input in mock mode to fail closed"
  );
}

