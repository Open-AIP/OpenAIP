import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { AipSubmissionsReviewRepo } from "./repo";
import { createMockAipSubmissionsReviewRepo } from "./repo.mock";
import { createSupabaseAipSubmissionsReviewRepo } from "./repo.supabase";

export function getAipSubmissionsReviewRepo(): AipSubmissionsReviewRepo {
  return selectRepo({
    label: "AipSubmissionsReviewRepo",
    mock: () => createMockAipSubmissionsReviewRepo(),
    supabase: () => createSupabaseAipSubmissionsReviewRepo(),
  });
}

