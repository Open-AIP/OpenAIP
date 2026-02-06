import { getAppEnv } from "@/shared/config/appEnv";
import type { AipSubmissionsReviewRepo } from "./submissionsReview.repo";
import { createMockAipSubmissionsReviewRepo } from "./submissionsReview.repo.mock";
import { createSupabaseAipSubmissionsReviewRepo } from "./submissionsReview.repo.supabase";

export function getAipSubmissionsReviewRepo(): AipSubmissionsReviewRepo {
  const env = getAppEnv();
  return env === "dev"
    ? createMockAipSubmissionsReviewRepo()
    : createSupabaseAipSubmissionsReviewRepo();
}

