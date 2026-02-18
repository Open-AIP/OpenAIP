import { getCommentRepo } from "@/lib/repos/feedback/repo";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { MOCK_PROJECTS_ROWS } from "@/mocks/fixtures/projects/projects.mock.fixture";
import type { CommentThread } from "@/lib/repos/feedback/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCommentRepoSelectorTests() {
  const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const oldMockEnv = process.env.NEXT_PUBLIC_USE_MOCKS;

  try {
    process.env.NEXT_PUBLIC_APP_ENV = "dev";
    const devRepo = getCommentRepo();
    const cityThreads = await devRepo.listThreadsForInbox({
      scope: "city",
      lguId: "city_001",
    });
    const barangayThreads = await devRepo.listThreadsForInbox({
      scope: "barangay",
      lguId: "barangay_001",
    });
    assert(Array.isArray(cityThreads), "Expected mock repo to return threads in dev");
    assert(Array.isArray(barangayThreads), "Expected mock repo to return scoped threads in dev");
    assert(
      cityThreads.length >= barangayThreads.length,
      "Expected city scope inbox to be a superset of barangay scope in mock repo"
    );

    const publicCityThreads = await devRepo.listThreadsForInbox({
      scope: "city",
      lguId: "city_001",
      visibility: "public",
    });

    assert(
      publicCityThreads.length <= cityThreads.length,
      "Expected public visibility inbox to be bounded by authenticated city inbox"
    );
    assert(
      publicCityThreads.every((thread) => {
        const aipStatus = resolveThreadAipStatus(thread);
        return aipStatus === "published";
      }),
      "Expected public visibility inbox to only include published AIP contexts"
    );

    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
    let threw = false;
    try {
      getCommentRepo();
    } catch (error) {
      threw = /server-only|not implemented|mock-only/i.test(
        error instanceof Error ? error.message : String(error)
      );
    }
    assert(threw, "Expected client-safe repo getter to throw outside mock mode");
  } finally {
    process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
    if (typeof oldMockEnv === "string") {
      process.env.NEXT_PUBLIC_USE_MOCKS = oldMockEnv;
    } else {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
    }
  }
}

function resolveThreadAipStatus(thread: CommentThread): string | null {
  const target = thread.target as { aipId?: string; projectId?: string };

  if (typeof target.aipId === "string") {
    return AIPS_TABLE.find((aip) => aip.id === target.aipId)?.status ?? null;
  }

  if (typeof target.projectId !== "string") return null;
  const project = MOCK_PROJECTS_ROWS.find((row) => row.id === target.projectId);
  if (!project?.aip_id) return null;
  return AIPS_TABLE.find((aip) => aip.id === project.aip_id)?.status ?? null;
}
