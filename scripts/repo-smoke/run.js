const fs = require("fs");
const path = require("path");
const Module = require("module");

const rootDir = path.resolve(__dirname, "..", "..");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const mapped = path.join(rootDir, request.slice(2));
    return originalResolve.call(this, mapped, parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

function registerTypeScriptExtension(ext) {
  require.extensions[ext] = function compile(module, filename) {
    const ts = require("typescript");
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2017,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };
}

registerTypeScriptExtension(".ts");
registerTypeScriptExtension(".tsx");

const { createMockFeedbackRepo } = require("@/features/feedback/data");
const { createMockChatRepo } = require("@/features/chat/data");
const { projectService } = require("@/features/projects/services/project-service");
const { getProjectsRepo } = require("@/features/projects/data/projectsRepo.selector");
const { mapUserToActorContext } = require("@/lib/domain/actor-context");
const {
  createMockFeedbackThreadsRepo: createMockFeedbackThreadRepo,
} = require("@/features/feedback/data/feedback.repo.mock");
const { listComments } = require("@/features/feedback/services/comments.service");
const {
  runCommentRepoSelectorTests,
} = require("@/features/feedback/services/__tests__/commentRepo.selector.test");
const {
  runProjectMapperTests,
} = require("@/features/projects/data/mappers/__tests__/project.mapper.test");
const {
  runProjectRepoTests,
} = require("@/features/projects/data/repos/__tests__/project.repo.mock.test");
const {
  runChatRepoTests,
} = require("@/features/chat/repo/mock/createMockChatRepo.test");
const {
  runAuditServiceTests,
} = require("@/features/audit/services/__tests__/auditService.test");
const {
  getAuditFeedForActor,
} = require("@/features/audit/services/auditService");
const {
  ACTIVITY_LOG_MOCK,
} = require("@/features/audit/mock/activity-log.mock");
const {
  runSubmissionsServiceTests,
} = require("@/features/submissions/services/__tests__/submissionsService.test");
const {
  getCitySubmissionsFeedForActor,
} = require("@/features/submissions/services/submissionsService");
const {
  AIP_SUBMISSIONS_MOCK,
} = require("@/features/submissions/mock/aip-submissions.mock");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests(testCases) {
  let failures = 0;

  for (const testCase of testCases) {
    try {
      await testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`FAIL ${testCase.name}: ${message}`);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

const tests = [
  {
    name: "ProjectsRepo.listByAip returns array",
    async run() {
      const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
      process.env.NEXT_PUBLIC_APP_ENV = "dev";
      try {
        const repo = getProjectsRepo();
        const result = await repo.listByAip("unknown");
        assert(Array.isArray(result), "Expected array result");
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
      }
    },
  },
  {
    name: "ProjectsRepo.getById unknown returns null",
    async run() {
      const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
      process.env.NEXT_PUBLIC_APP_ENV = "dev";
      try {
        const repo = getProjectsRepo();
        const result = await repo.getById("unknown");
        assert(result === null, "Expected null for unknown project id");
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
      }
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
  {
    name: "projectService.getHealthProjects returns expected count",
    async run() {
      const results = await projectService.getHealthProjects();
      assert(Array.isArray(results), "Expected array result");
      assert(results.length === 8, "Expected 8 health projects from mock data");
    },
  },
  {
    name: "getProjectsRepo dev defaults to mock",
    async run() {
      const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
      process.env.NEXT_PUBLIC_APP_ENV = "dev";
      try {
        const repo = getProjectsRepo();
        assert(!!repo, "Expected repo instance in dev");
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
      }
    },
  },
  {
    name: "getProjectsRepo staging throws not implemented",
    async run() {
      const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
      process.env.NEXT_PUBLIC_APP_ENV = "staging";
      try {
        let threw = false;
        try {
          getProjectsRepo();
        } catch (error) {
          threw = /not implemented/i.test(
            error instanceof Error ? error.message : String(error)
          );
        }
        assert(threw, "Expected Not implemented error in staging");
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
      }
    },
  },
  {
    name: "mapUserToActorContext barangay_official maps barangay scope",
    async run() {
      const user = {
        userId: "user_001",
        userRole: "barangay_official",
        userLocale: { barangay_id: "uuid" },
      };
      const result = mapUserToActorContext(user);
      assert(result?.scope.kind === "barangay", "Expected barangay scope");
      assert(result?.scope.id === "uuid", "Expected barangay id to match");
    },
  },
  {
    name: "mapUserToActorContext admin maps none scope",
    async run() {
      const user = { userId: "admin_001", userRole: "admin" };
      const result = mapUserToActorContext(user);
      assert(result?.scope.kind === "none", "Expected none scope for admin");
    },
  },
  {
    name: "mapUserToActorContext city_official maps city scope",
    async run() {
      const user = {
        userId: "user_002",
        userRole: "city_official",
        userLocale: { city_id: "city-123" },
      };
      const result = mapUserToActorContext(user);
      assert(result?.scope.kind === "city", "Expected city scope");
      assert(result?.scope.id === "city-123", "Expected city id to match");
    },
  },
  {
    name: "mapUserToActorContext missing required id returns null",
    async run() {
      const user = { userId: "user_003", userRole: "city_official" };
      const result = mapUserToActorContext(user);
      assert(result === null, "Expected null when required id is missing");
    },
  },
  {
    name: "FeedbackRepo.createReply enforces parent target invariant",
    async run() {
      const repo = createMockFeedbackThreadRepo();
      const root = await repo.createRoot({
        target: { target_type: "aip", aip_id: "A1" },
        body: "root",
        authorId: "user_1",
      });

      let threw = false;
      try {
        await repo.createReply({
          parentId: root.id,
          body: "reply",
          authorId: "user_2",
          target: { target_type: "aip", aip_id: "A2" },
        });
      } catch (error) {
        threw = /reply feedback must match parent target/i.test(
          error instanceof Error ? error.message : String(error)
        );
      }
      assert(threw, "Expected reply target mismatch to throw");
    },
  },
  {
    name: "FeedbackRepo.listThreadMessages preserves chronological order",
    async run() {
      const repo = createMockFeedbackThreadRepo();
      const messages = await repo.listThreadMessages("thread_002");
      assert(messages.length >= 2, "Expected seeded replies for thread_002");
      for (let i = 1; i < messages.length; i += 1) {
        assert(
          new Date(messages[i - 1].created_at).getTime() <=
            new Date(messages[i].created_at).getTime(),
          "Expected messages sorted oldest to newest"
        );
      }
    },
  },
  {
    name: "comments.service listComments preserves latest-first ordering",
    async run() {
      const result = await listComments();
      const items = result.items;
      for (let i = 1; i < items.length; i += 1) {
        assert(
          new Date(items[i - 1].created_at).getTime() >=
            new Date(items[i].created_at).getTime(),
          "Expected comments sorted newest to oldest"
        );
      }
    },
  },
  {
    name: "getCommentRepo uses supabase outside dev",
    async run() {
      await runCommentRepoSelectorTests();
    },
  },
  {
    name: "project.mapper tests",
    async run() {
      await runProjectMapperTests();
    },
  },
  {
    name: "project.repo.mock tests",
    async run() {
      await runProjectRepoTests();
    },
  },
  {
    name: "chat.repo.mock tests",
    async run() {
      await runChatRepoTests();
    },
  },
  {
    name: "auditService role gating",
    async run() {
      await runAuditServiceTests();
    },
  },
  {
    name: "auditService dev fallback shows scoped logs",
    async run() {
      const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
      process.env.NEXT_PUBLIC_APP_ENV = "dev";
      try {
        const actor = {
          userId: "uuid-not-in-mock",
          role: "city_official",
          scope: { kind: "city", id: "cabuyao" },
        };
        const result = await getAuditFeedForActor(actor);
        const expected = ACTIVITY_LOG_MOCK.filter(
          (row) => row.scope?.scope_type === "city"
        ).length;
        assert(
          result.length === expected,
          "Expected dev fallback to return city-scoped activity logs"
        );
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
      }
    },
  },
  {
    name: "submissionsService role gating",
    async run() {
      await runSubmissionsServiceTests();
    },
  },
  {
    name: "submissionsService dev fallback for null actor",
    async run() {
      const oldEnv = process.env.NEXT_PUBLIC_APP_ENV;
      process.env.NEXT_PUBLIC_APP_ENV = "dev";
      try {
        const result = await getCitySubmissionsFeedForActor(null);
        const expected = AIP_SUBMISSIONS_MOCK.filter(
          (row) => row.scope === "barangay"
        ).length;
        assert(
          result.length === expected,
          "Expected null-actor dev feed to return mock submissions"
        );
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = oldEnv;
      }
    },
  },
];

void runTests(tests);
