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

const { createMockProjectRepo } = require("@/features/projects/data");
const { createMockFeedbackRepo } = require("@/features/feedback/data");
const { createMockChatRepo } = require("@/features/chat/data");
const { projectService } = require("@/features/projects/services/project-service");
const { getProjectsRepo } = require("@/features/projects/data/projectsRepo.selector");
const { mapUserToActorContext } = require("@/lib/domain/actor-context");
const { createMockFeedbackRepo } = require("@/features/feedback/data/feedback.repo.mock");
const { listComments } = require("@/features/feedback/services/comments.service");
const {
  inferKind,
  mapProjectRowToUiModel,
} = require("@/features/projects/data/mappers/project.mapper");

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
      const repo = createMockFeedbackRepo();
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
      const repo = createMockFeedbackRepo();
      const messages = await repo.listThreadMessages("cmtc_002");
      assert(messages.length >= 2, "Expected seeded replies for cmtc_002");
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
    name: "inferKind maps categories",
    async run() {
      assert(
        inferKind({ category: "health" }) === "health",
        "Expected health category"
      );
      assert(
        inferKind({ category: "infrastructure" }) === "infrastructure",
        "Expected infrastructure category"
      );
      assert(
        inferKind({ category: "other" }) === "other",
        "Expected other category"
      );
    },
  },
  {
    name: "mapProjectRowToUiModel produces health kind",
    async run() {
      const project = mapProjectRowToUiModel(
        {
          id: "PROJ-H-1",
          aip_id: null,
          aip_ref_code: "PROJ-H-1",
          program_project_description: "Test Health",
          implementing_agency: "Health Office",
          start_date: "2026-01-01",
          completion_date: null,
          expected_output: null,
          source_of_funds: null,
          personal_services: null,
          maintenance_and_other_operating_expenses: null,
          capital_outlay: null,
          total: 123,
          climate_change_adaptation: null,
          climate_change_mitigation: null,
          climate_change_adaptation_amount: null,
          climate_change_mitigation_amount: null,
          errors: null,
          category: "health",
          sector_code: null,
          is_human_edited: null,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          created_by: null,
          updated_by: null,
        },
        {
          project_id: "PROJ-H-1",
          program_name: "January",
          description: null,
          target_participants: "Residents",
          total_target_participants: 100,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          created_by: null,
          updated_by: null,
        },
        null
      );

      assert(project.kind === "health", "Expected health kind");
    },
  },
  {
    name: "ProjectsRepo.getById returns expected kind",
    async run() {
      const repo = getProjectsRepo();
      const health = await repo.getById("PROJ-H-2026-001");
      const infra = await repo.getById("PROJ-I-2026-001");
      assert(health?.kind === "health", "Expected health kind for PROJ-H-2026-001");
      assert(
        infra?.kind === "infrastructure",
        "Expected infrastructure kind for PROJ-I-2026-001"
      );
    },
  },
];

void runTests(tests);
