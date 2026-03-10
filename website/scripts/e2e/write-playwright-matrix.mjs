import fs from "node:fs";
import path from "node:path";

const PROJECTS = [
  { name: "chromium-desktop", label: "Chromium (Desktop)" },
  { name: "firefox-desktop", label: "Firefox (Desktop)" },
  { name: "pixel5-mobile", label: "Pixel 5 (Mobile)" },
  { name: "iphone13-mobile", label: "iPhone 13 (Mobile)" },
];

const JSON_RESULTS_PATH = path.resolve(process.cwd(), "test-results/playwright-results.json");
const MATRIX_PATH = path.resolve(
  process.cwd(),
  "../evidence-pack/03-compatibility/playwright-matrix.md"
);

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readResultsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function visitSuites(suites, callback) {
  for (const suite of suites ?? []) {
    callback(suite);
    if (Array.isArray(suite.suites) && suite.suites.length > 0) {
      visitSuites(suite.suites, callback);
    }
  }
}

function getProjectSummaries(results) {
  const byProject = new Map();

  for (const project of PROJECTS) {
    byProject.set(project.name, {
      passed: 0,
      failed: 0,
      skipped: 0,
    });
  }

  if (!results) {
    return byProject;
  }

  visitSuites(results.suites, (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const projectName = test.projectName;
        if (!byProject.has(projectName)) continue;

        const summary = byProject.get(projectName);
        const outcome = typeof test.outcome === "string" ? test.outcome : null;

        if (outcome === "unexpected" || outcome === "flaky") {
          summary.failed += 1;
          continue;
        }

        if (outcome === "expected") {
          summary.passed += 1;
          continue;
        }

        if (outcome === "skipped") {
          summary.skipped += 1;
          continue;
        }

        const resultStatuses = (test.results ?? []).map((result) => result.status);
        if (resultStatuses.some((status) => status === "failed" || status === "timedOut" || status === "interrupted")) {
          summary.failed += 1;
        } else if (resultStatuses.some((status) => status === "passed")) {
          summary.passed += 1;
        } else {
          summary.skipped += 1;
        }
      }
    }
  });

  return byProject;
}

function projectStatusLabel(summary) {
  if (summary.failed > 0) return "FAIL";
  if (summary.passed > 0) return "PASS";
  if (summary.skipped > 0) return "SKIPPED";
  return "NOT RUN";
}

function buildMarkdown({ baseUrl, commitHash, generatedAtIso, summaries }) {
  const rows = PROJECTS.map((project) => {
    const summary = summaries.get(project.name);
    const status = projectStatusLabel(summary);
    return `| ${project.label} | ${status} | ${summary.passed} | ${summary.failed} | ${summary.skipped} |`;
  });

  const metadata = [
    `- Generated at: ${generatedAtIso}`,
    `- Base URL: ${baseUrl}`,
    commitHash ? `- Commit: ${commitHash}` : null,
    `- HTML report: [Open report](../01-functional/playwright-report/index.html)`,
  ]
    .filter(Boolean)
    .join("\n");

  return `# Playwright Compatibility Matrix\n\n${metadata}\n\n| Project | Status | Passed | Failed | Skipped |\n| --- | --- | ---: | ---: | ---: |\n${rows.join("\n")}\n`;
}

function main() {
  const results = readResultsFile(JSON_RESULTS_PATH);
  const summaries = getProjectSummaries(results);
  const generatedAtIso = new Date().toISOString();
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const commitHash = process.env.E2E_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "";

  const markdown = buildMarkdown({
    baseUrl,
    commitHash,
    generatedAtIso,
    summaries,
  });

  ensureDirectory(MATRIX_PATH);
  fs.writeFileSync(MATRIX_PATH, markdown, "utf8");
  console.log(`Compatibility matrix written to ${MATRIX_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
