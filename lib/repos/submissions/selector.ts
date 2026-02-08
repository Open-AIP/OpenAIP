import { getAppEnv } from "@/shared/config/appEnv";
import type { AipSubmissionsReviewRepo } from "./repo";
import { createMockAipSubmissionsReviewRepo } from "./repo.mock";
import { createSupabaseAipSubmissionsReviewRepo } from "./repo.supabase";

export function getAipSubmissionsReviewRepo(): AipSubmissionsReviewRepo {
  const env = getAppEnv();
  return env === "dev"
    ? createMockAipSubmissionsReviewRepo()
    : createSupabaseAipSubmissionsReviewRepo();
}
