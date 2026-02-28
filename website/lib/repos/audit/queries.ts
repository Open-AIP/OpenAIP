import "server-only";

import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAppEnv } from "@/lib/config/appEnv";
import type { ActivityLogRow } from "./repo";
import { getAuditRepo } from "./repo.server";

const DEFAULT_CRUD_DEDUPE_WINDOW_MS = 15_000;

// [DATAFLOW] Page -> `getAuditFeed()` -> `AuditRepo` adapter (mock now; Supabase later).
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

function toMetadataObject(
  metadata: ActivityLogRow["metadata"]
): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  return metadata as Record<string, unknown>;
}

function getMetadataString(row: ActivityLogRow, key: string): string | null {
  const metadata = toMetadataObject(row.metadata);
  if (!metadata) return null;
  const value = metadata[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function applyCrudDuplicateSuppression(
  logs: ActivityLogRow[],
  windowMs = DEFAULT_CRUD_DEDUPE_WINDOW_MS
): ActivityLogRow[] {
  const workflowRows = logs.filter(
    (row) =>
      getMetadataString(row, "source") === "workflow" &&
      !!getMetadataString(row, "hide_crud_action")
  );

  if (workflowRows.length === 0) return logs;

  const hiddenCrudIds = new Set<string>();

  for (const workflowRow of workflowRows) {
    const hideCrudAction = getMetadataString(workflowRow, "hide_crud_action");
    if (!hideCrudAction) continue;

    const workflowCreatedAt = Date.parse(workflowRow.createdAt);
    if (!Number.isFinite(workflowCreatedAt)) continue;

    for (const candidate of logs) {
      if (candidate.id === workflowRow.id || hiddenCrudIds.has(candidate.id)) {
        continue;
      }
      if (candidate.actorId !== workflowRow.actorId) continue;
      if (candidate.entityType !== workflowRow.entityType) continue;
      if (candidate.entityId !== workflowRow.entityId) continue;
      if (candidate.action !== hideCrudAction) continue;
      if (getMetadataString(candidate, "source") !== "crud") continue;

      const candidateCreatedAt = Date.parse(candidate.createdAt);
      if (!Number.isFinite(candidateCreatedAt)) continue;
      if (Math.abs(workflowCreatedAt - candidateCreatedAt) > windowMs) continue;

      hiddenCrudIds.add(candidate.id);
    }
  }

  if (hiddenCrudIds.size === 0) return logs;
  return logs.filter((row) => !hiddenCrudIds.has(row.id));
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

  if (actor.role === "barangay_official") {
    if (actor.scope.kind !== "barangay" || !actor.scope.id) {
      return [];
    }

    const scoped = await repo.listBarangayOfficialActivity(actor.scope.id);
    if (scoped.length > 0) {
      return applyCrudDuplicateSuppression(scoped);
    }

    if (getAppEnv() === "dev") {
      const all = await repo.listAllActivity();
      return applyCrudDuplicateSuppression(
        all.filter(
          (row) =>
            row.actorRole === "barangay_official" &&
            row.scope?.scope_type === "barangay" &&
            row.scope.barangay_id === actor.scope.id
        )
      );
    }

    return [];
  }

  if (actor.role === "city_official" || actor.role === "municipal_official") {
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
