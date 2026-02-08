import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAppEnv } from "@/shared/config/appEnv";
import type { ActivityLogRow } from "./repo";
import { getAuditRepo } from "./selector";

// [DATAFLOW] Page → `getAuditFeed()` → `AuditRepo` adapter (mock now; Supabase later).
// [SECURITY] DBV2 forbids client writes to `public.activity_log`; this module remains read-only.
export async function getAuditFeed(): Promise<ActivityLogRow[]> {
  const actor = await getActorContext();
  return getAuditFeedForActor(actor);
}

function filterByScopeKind(
  logs: ActivityLogRow[],
  kind: ActorContext["scope"]["kind"]
): ActivityLogRow[] {
  if (kind === "none") return logs;
  if (kind === "barangay") {
    return logs.filter((row) => row.scope?.scope_type === "barangay");
  }
  if (kind === "city") {
    return logs.filter((row) => row.scope?.scope_type === "city");
  }
  if (kind === "municipality") {
    return logs.filter((row) => row.scope?.scope_type === "municipality");
  }
  return logs;
}

export async function getAuditFeedForActor(
  actor: ActorContext | null
): Promise<ActivityLogRow[]> {
  const repo = getAuditRepo();

  if (!actor) {
    if (getAppEnv() === "dev") {
      return repo.listAllActivity();
    }
    return [];
  }

  if (actor.role === "admin") {
    return repo.listAllActivity();
  }

  if (
    actor.role === "barangay_official" ||
    actor.role === "city_official" ||
    actor.role === "municipal_official"
  ) {
    const mine = await repo.listMyActivity(actor.userId);
    if (mine.length > 0) {
      return mine;
    }

    // Dev UX: if we're authenticated but have no matching mock actorId,
    // fall back to showing logs within the actor scope so the Audit tab is usable.
    if (getAppEnv() === "dev") {
      const all = await repo.listAllActivity();
      return filterByScopeKind(all, actor.scope.kind);
    }

    return [];
  }

  return [];
}

