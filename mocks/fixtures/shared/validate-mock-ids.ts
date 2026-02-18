import { PROJECTS_TABLE } from "@/mocks/fixtures/projects/projects-table.fixture";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";
import { COMMENT_THREADS_FIXTURE } from "@/mocks/fixtures/feedback/comment-threads.fixture";
import { COMMENT_MESSAGES_FIXTURE } from "@/mocks/fixtures/feedback/comment-messages.fixture";

type ValidationIssue = {
  message: string;
};

export function validateMockIds() {
  const issues: ValidationIssue[] = [];

  const projectIds = new Set(PROJECTS_TABLE.map((project) => project.projectRefCode));
  const aipIds = new Set(AIPS_TABLE.map((aip) => aip.id));
  const aipItemsById = new Map(AIP_PROJECT_ROWS_TABLE.map((row) => [row.id, row.aipId]));
  const threadIds = new Set(COMMENT_THREADS_FIXTURE.map((thread) => thread.id));

  for (const thread of COMMENT_THREADS_FIXTURE) {
    if (thread.target.targetKind === "project") {
      if (!projectIds.has(thread.target.projectId)) {
        issues.push({
          message: `Missing project for thread ${thread.id}: projectId=${thread.target.projectId}`,
        });
      }
    } else if (thread.target.targetKind === "aip") {
      if (!aipIds.has(thread.target.aipId)) {
        issues.push({
          message: `Missing AIP for thread ${thread.id}: aipId=${thread.target.aipId}`,
        });
      }
      if (thread.target.fieldKey) {
        const aipItemOwner = aipItemsById.get(thread.target.fieldKey);
        if (!aipItemOwner) {
          issues.push({
            message: `Missing AIP item for thread ${thread.id}: fieldKey=${thread.target.fieldKey}`,
          });
        } else if (aipItemOwner !== thread.target.aipId) {
          issues.push({
            message: `AIP item mismatch for thread ${thread.id}: fieldKey=${thread.target.fieldKey} belongs to ${aipItemOwner}`,
          });
        }
      }
    }
  }

  for (const message of COMMENT_MESSAGES_FIXTURE) {
    if (!threadIds.has(message.threadId)) {
      issues.push({
        message: `Missing thread for message ${message.id}: threadId=${message.threadId}`,
      });
    }
  }

  if (issues.length > 0) {
    const details = issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(`Mock ID validation failed with ${issues.length} issue(s):\n${details}`);
  }
}
