import "server-only";

import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import type { ListSubmissionsResult } from "./repo";
import { getAipSubmissionsReviewRepo } from "./repo.server";

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
    return emptyResult();
  }

  const repo = getAipSubmissionsReviewRepo();
  if (actor.role === "city_official" && actor.scope.kind === "city" && actor.scope.id) {
    return repo.listSubmissionsForCity({ cityId: actor.scope.id, actor });
  }

  if (actor.role === "admin") {
    return repo.listSubmissionsForCity({ cityId: "admin", actor });
  }

  return emptyResult();
}
