import type { SubmissionsRepo } from "./SubmissionsRepo";
import type { AipSubmissionItem } from "../types/submissions.types";
import { AIP_SUBMISSIONS_MOCK } from "../mock/aip-submissions.mock";

function sortNewestFirst(rows: AipSubmissionItem[]): AipSubmissionItem[] {
  return [...rows].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export function createMockSubmissionsRepo(): SubmissionsRepo {
  return {
    async listBarangaySubmissions() {
      return sortNewestFirst(AIP_SUBMISSIONS_MOCK.filter((row) => row.scope === "barangay"));
    },
  };
}

