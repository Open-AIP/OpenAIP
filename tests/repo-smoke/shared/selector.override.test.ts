import { getProjectsRepo } from "@/lib/repos/projects/repo.server";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runRepoSelectorOverrideTests() {
  const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const oldUseMocks = process.env.NEXT_PUBLIC_USE_MOCKS;

  try {
    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    process.env.NEXT_PUBLIC_USE_MOCKS = "true";

    const repo = getProjectsRepo();
    const rows = await repo.listHealth();
    assert(Array.isArray(rows), "Expected selector override to return mock repo");
  } finally {
    process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
    process.env.NEXT_PUBLIC_USE_MOCKS = oldUseMocks;
  }
}

