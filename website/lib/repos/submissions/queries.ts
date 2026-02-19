import "server-only";

import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import type { ListSubmissionsResult } from "./repo";
import { getAipSubmissionsReviewRepo } from "./repo.server";

// [DATAFLOW] Page → query → `AipSubmissionsReviewRepo` → adapter (mock now; Supabase later).
// [SECURITY] Only city_official/admin should see a review feed; unauthorized callers fail fast.
const UNAUTHORIZED_ERROR = "Unauthorized.";

export async function getCitySubmissionsFeed(): Promise<ListSubmissionsResult> {
  const actor = await getActorContext();
  return getCitySubmissionsFeedForActor(actor);
}

export async function getCitySubmissionsFeedForActor(
  actor: ActorContext | null
): Promise<ListSubmissionsResult> {
  if (!actor) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  if (actor.role !== "admin" && actor.role !== "city_official") {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const cityId =
    actor.role === "city_official" && actor.scope.kind === "city"
      ? actor.scope.id
      : "city_001";

  if (!cityId) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const repo = getAipSubmissionsReviewRepo();
  return repo.listSubmissionsForCity({ cityId, actor });
}
