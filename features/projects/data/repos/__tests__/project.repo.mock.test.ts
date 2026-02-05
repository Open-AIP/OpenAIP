import { createMockProjectsRepoImpl } from "../project.repo.mock";

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
}
