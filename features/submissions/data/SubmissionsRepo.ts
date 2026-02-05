import type { AipSubmissionItem } from "../types/submissions.types";

export interface SubmissionsRepo {
  listBarangaySubmissions(): Promise<AipSubmissionItem[]>;
}

