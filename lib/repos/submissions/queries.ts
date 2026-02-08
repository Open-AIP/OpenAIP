import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAppEnv } from "@/lib/config/appEnv";
import type { ListSubmissionsResult } from "./repo";
import { getAipSubmissionsReviewRepo } from "./selector";

// [DATAFLOW] Page → query → `AipSubmissionsReviewRepo` → adapter (mock now; Supabase later).
// [SECURITY] Only city_official/admin should see a review feed; return empty results for other roles (defense-in-depth vs RLS).
function emptyResult(): ListSubmissionsResult {
  return {
    rows: [],
    counts: {
      total: 0,
      published: 0,
      underReview: 0,
      pendingReview: 0,
      forRevision: 0,
    },
  };
}

export async function getCitySubmissionsFeed(): Promise<ListSubmissionsResult> {
  const actor = await getActorContext();
  return getCitySubmissionsFeedForActor(actor);
}

export async function getCitySubmissionsFeedForActor(
  actor: ActorContext | null
): Promise<ListSubmissionsResult> {
  if (!actor) {
    // Dev UX: allow viewing mock submissions even if auth context is missing.
    // This keeps the page usable while auth/session wiring is in flux.
    if (getAppEnv() === "dev") {
      const repo = getAipSubmissionsReviewRepo();
      return repo.listSubmissionsForCity({ cityId: "city_001", actor: null });
    }
    return emptyResult();
  }

  if (actor.role !== "admin" && actor.role !== "city_official") {
    return emptyResult();
  }

  const cityId =
    actor.role === "city_official" && actor.scope.kind === "city"
      ? actor.scope.id
      : "city_001";

  if (!cityId) {
    return emptyResult();
  }

  const repo = getAipSubmissionsReviewRepo();
  return repo.listSubmissionsForCity({ cityId, actor });
}
