import { getCommentRepo } from "@/lib/repos/feedback/repo";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCommentRepoSelectorTests() {
  const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;

  try {
    process.env.NEXT_PUBLIC_APP_ENV = "dev";
    const devRepo = getCommentRepo();
    const threads = await devRepo.listThreadsForInbox({ lguId: "lgu_001" });
    assert(Array.isArray(threads), "Expected mock repo to return threads in dev");

    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    let threw = false;
    try {
      getCommentRepo();
    } catch (error) {
      threw = /server-only|not implemented/i.test(
        error instanceof Error ? error.message : String(error)
      );
    }
    assert(threw, "Expected client-safe repo getter to throw outside mock mode");
  } finally {
    process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
  }
}

