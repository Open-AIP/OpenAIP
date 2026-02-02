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
];

void runTests(tests);
