import { PROJECTS_TABLE } from "@/features/projects/mock/projects-table";
import { AIPS_TABLE } from "@/features/aip/mock/aips.table";
import { AIP_PROJECT_ROWS_TABLE } from "@/features/aip/mock/aip-project-rows.table";
import { COMMENT_THREADS_MOCK } from "@/features/feedback/mock/comment-threads.mock";
import { COMMENT_MESSAGES_MOCK } from "@/features/feedback/mock/comment-messages.mock";

type ValidationIssue = {
  message: string;
};

export function validateMockIds() {
  const issues: ValidationIssue[] = [];

  const projectIds = new Set(PROJECTS_TABLE.map((project) => project.projectRefCode));
  const aipIds = new Set(AIPS_TABLE.map((aip) => aip.id));
  const aipItemsById = new Map(
    AIP_PROJECT_ROWS_TABLE.map((row) => [row.id, row.aipId])
  );
  const threadIds = new Set(COMMENT_THREADS_MOCK.map((thread) => thread.id));

  for (const thread of COMMENT_THREADS_MOCK) {
    if (thread.target.targetKind === "project") {
      if (!projectIds.has(thread.target.projectId)) {
        issues.push({
          message: `Missing project for thread ${thread.id}: projectId=${thread.target.projectId}`,
        });
      }
    } else {
      if (!aipIds.has(thread.target.aipId)) {
        issues.push({
          message: `Missing AIP for thread ${thread.id}: aipId=${thread.target.aipId}`,
        });
      }

      const aipItemOwner = aipItemsById.get(thread.target.aipItemId);
      if (!aipItemOwner) {
        issues.push({
          message: `Missing AIP item for thread ${thread.id}: aipItemId=${thread.target.aipItemId}`,
        });
      } else if (aipItemOwner !== thread.target.aipId) {
        issues.push({
          message: `AIP item mismatch for thread ${thread.id}: aipItemId=${thread.target.aipItemId} belongs to ${aipItemOwner}`,
        });
      }
    }
  }

  for (const message of COMMENT_MESSAGES_MOCK) {
    if (!threadIds.has(message.threadId)) {
      issues.push({
        message: `Missing thread for message ${message.id}: threadId=${message.threadId}`,
      });
    }
  }

  if (issues.length > 0) {
    const details = issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(
      `Mock ID validation failed with ${issues.length} issue(s):\n${details}`
    );
  }
}
