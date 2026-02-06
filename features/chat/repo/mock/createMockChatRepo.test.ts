import { createMockChatRepo, __unsafeAddMessage } from "./createMockChatRepo";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runChatRepoTests() {
  const repo = createMockChatRepo();
  const session = await repo.createSession("u1");

  let threw = false;
  try {
    await __unsafeAddMessage(repo, session.id, "assistant", "hello");
  } catch (error) {
    threw = (error as Error).message === "INVALID_ROLE";
  }
  assert(threw, "Expected INVALID_ROLE when adding non-user role");

  await repo.appendUserMessage(session.id, "first");
  await repo.appendUserMessage(session.id, "second");
  const messages = await repo.listMessages(session.id);
  assert(messages.length === 2, "Expected 2 messages");
  assert(messages[0].content === "first", "Expected insertion order preserved");
  assert(messages[1].content === "second", "Expected insertion order preserved");
  assert(messages.every((m) => m.role === "user"), "Expected user-only roles");

  const repo2 = createMockChatRepo();
  const s1 = await repo2.createSession("u1");
  await repo2.createSession("u2");
  const sessions = await repo2.listSessions("u1");
  assert(
    sessions.every((s) => s.userId === "u1"),
    "Expected only u1 sessions"
  );
  assert(sessions.some((s) => s.id === s1.id), "Expected u1 session returned");
}
