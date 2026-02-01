import { createMockProjectRepo } from "@/features/projects/data";
import { createMockFeedbackRepo } from "@/features/feedback/data";
import { createMockChatRepo } from "@/features/chat/data";

type TestCase = {
  name: string;
  run: () => Promise<void>;
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests(testCases: TestCase[]) {
  let failures = 0;

  for (const testCase of testCases) {
    try {
      await testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures += 1;
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`FAIL ${testCase.name}: ${message}`);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

const tests: TestCase[] = [
  {
    name: "ProjectRepo.listByAipId returns array",
    async run() {
      const repo = createMockProjectRepo();
      const result = await repo.listByAipId("unknown");
      assert(Array.isArray(result), "Expected array result");
    },
  },
  {
    name: "ProjectRepo.getById unknown returns null",
    async run() {
      const repo = createMockProjectRepo();
      const result = await repo.getById("unknown");
      assert(result === null, "Expected null for unknown project id");
    },
  },
  {
    name: "FeedbackRepo.listForAip returns array",
    async run() {
      const repo = createMockFeedbackRepo();
      const result = await repo.listForAip("unknown");
      assert(Array.isArray(result), "Expected array result");
    },
  },
  {
    name: "FeedbackRepo.update unknown returns null",
    async run() {
      const repo = createMockFeedbackRepo();
      const result = await repo.update("unknown", { body: "noop" });
      assert(result === null, "Expected null for unknown feedback id");
    },
  },
  {
    name: "ChatRepo.appendUserMessage increases message count",
    async run() {
      const repo = createMockChatRepo();
      const session = await repo.createSession("user_001");
      const before = await repo.listMessages(session.id);
      await repo.appendUserMessage(session.id, "hello");
      const after = await repo.listMessages(session.id);
      assert(
        after.length === before.length + 1,
        "Expected message count to increase by 1"
      );
    },
  },
  {
    name: "ChatRepo.getSession unknown returns null",
    async run() {
      const repo = createMockChatRepo();
      const result = await repo.getSession("unknown");
      assert(result === null, "Expected null for unknown session id");
    },
  },
];

void runTests(tests);
