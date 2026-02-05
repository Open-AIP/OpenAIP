import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAuditRepo } from "../data/auditRepo.selector";
import type { ActivityLogRow } from "../types/audit.types";

export async function getAuditFeed(): Promise<ActivityLogRow[]> {
  const actor = await getActorContext();
  return getAuditFeedForActor(actor);
}

export async function getAuditFeedForActor(
  actor: ActorContext | null
): Promise<ActivityLogRow[]> {
  if (!actor) return [];

  const repo = getAuditRepo();

  if (actor.role === "admin") {
    return repo.listAllActivity();
  }

  if (
    actor.role === "barangay_official" ||
    actor.role === "city_official" ||
    actor.role === "municipal_official"
  ) {
    return repo.listMyActivity(actor.userId);
  }

  return [];
}

