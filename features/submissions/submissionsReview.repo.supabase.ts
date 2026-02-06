import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AipSubmissionsReviewRepo } from "./submissionsReview.repo";

export function createSupabaseAipSubmissionsReviewRepo(): AipSubmissionsReviewRepo {
  throw new NotImplementedError(
    "Supabase AipSubmissionsReviewRepo not implemented yet. Expected until Supabase repo is added."
  );
}

