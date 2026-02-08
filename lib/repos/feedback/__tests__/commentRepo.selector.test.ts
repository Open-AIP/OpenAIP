import { getCommentRepo } from "@/lib/repos/feedback/selector";

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
    const stagingRepo = getCommentRepo();
    let threw = false;
    try {
      await stagingRepo.listThreadsForInbox({ lguId: "lgu_001" });
    } catch (error) {
      threw = /not implemented/i.test(
        error instanceof Error ? error.message : String(error)
      );
    }
    assert(threw, "Expected Supabase repo in staging");
  } finally {
    process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
  }
}

