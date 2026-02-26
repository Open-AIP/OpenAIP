import type { ActorContext, ScopeKind } from "@/lib/domain/actor-context";
import type { RoleType } from "@/lib/contracts/databasev2";

export const UNAUTHORIZED_ERROR_MESSAGE = "Unauthorized.";

export function assertActor(
  actor: ActorContext | null,
  message = UNAUTHORIZED_ERROR_MESSAGE
): asserts actor is ActorContext {
  if (!actor) {
    throw new Error(message);
  }
}

export function assertActorRole(
  actor: ActorContext | null,
  allowedRoles: RoleType[],
  message = UNAUTHORIZED_ERROR_MESSAGE
): asserts actor is ActorContext {
  assertActor(actor, message);
  if (!allowedRoles.includes(actor.role)) {
    throw new Error(message);
  }
}

export function assertActorScope(
  actor: ActorContext | null,
  scopeKind: ScopeKind,
  scopeId?: string | null,
  message = UNAUTHORIZED_ERROR_MESSAGE
): asserts actor is ActorContext {
  assertActor(actor, message);
  if (actor.scope.kind !== scopeKind) {
    throw new Error(message);
  }
  if (scopeId && actor.scope.id !== scopeId) {
    throw new Error(message);
  }
}

export function getActivityScopeFromActor(
  actor: ActorContext | null
): {
  cityId?: string | null;
  municipalityId?: string | null;
  barangayId?: string | null;
} {
  if (!actor) return {};
  if (!actor.scope.id) return {};

  if (actor.scope.kind === "city") {
    return { cityId: actor.scope.id };
  }
  if (actor.scope.kind === "municipality") {
    return { municipalityId: actor.scope.id };
  }
  if (actor.scope.kind === "barangay") {
    return { barangayId: actor.scope.id };
  }
  return {};
}

