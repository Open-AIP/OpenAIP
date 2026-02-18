import type { LguScopeKind } from "@/lib/auth/scope";
import type { ScopeContextValue } from "@/lib/auth/scope-context";
import type { ActorContext } from "./actor-context";
import type { RoleType } from "@/lib/contracts/databasev2/enums";

type BuildScopeContextParams = {
  actor: ActorContext | null;
  fallbackRole: RoleType;
  fallbackScope: LguScopeKind;
  userLocale: unknown;
};

function pickId(source: unknown, snake: string, camel: string): string | null {
  if (!source || typeof source !== "object") return null;
  const value = (source as Record<string, unknown>)[snake];
  if (typeof value === "string" && value.trim().length > 0) return value;
  const alt = (source as Record<string, unknown>)[camel];
  if (typeof alt === "string" && alt.trim().length > 0) return alt;
  return null;
}

function inferScopeName(scopeType: LguScopeKind, userLocale: unknown): string {
  if (typeof userLocale === "string" && userLocale.trim().length > 0) {
    return userLocale;
  }
  if (userLocale && typeof userLocale === "object") {
    const locale = userLocale as Record<string, unknown>;
    const candidates = [
      locale.scope_name,
      locale.scopeName,
      locale.city_name,
      locale.cityName,
      locale.barangay_name,
      locale.barangayName,
      locale.municipality_name,
      locale.municipalityName,
      locale.name,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  if (scopeType === "city") return "City";
  if (scopeType === "barangay") return "Barangay";
  return "Municipality";
}

export function buildScopeContextValue({
  actor,
  fallbackRole,
  fallbackScope,
  userLocale,
}: BuildScopeContextParams): ScopeContextValue {
  const localeObject = userLocale && typeof userLocale === "object" ? userLocale : null;
  const scopeType =
    actor && actor.scope.kind !== "none" ? (actor.scope.kind as LguScopeKind) : fallbackScope;
  const role = actor?.role ?? fallbackRole;

  const actorScopeId = actor?.scope.id ?? null;
  const barangayId =
    (scopeType === "barangay" ? actorScopeId : null) ??
    pickId(localeObject, "barangay_id", "barangayId");
  const cityId =
    (scopeType === "city" ? actorScopeId : null) ?? pickId(localeObject, "city_id", "cityId");
  const municipalityId =
    (scopeType === "municipality" ? actorScopeId : null) ??
    pickId(localeObject, "municipality_id", "municipalityId");

  const resolvedScopeId =
    (scopeType === "barangay" ? barangayId : null) ??
    (scopeType === "city" ? cityId : null) ??
    municipalityId ??
    "";

  return {
    scope_type: scopeType,
    scope_id: resolvedScopeId,
    role,
    scope_name: inferScopeName(scopeType, userLocale),
    barangay_id: barangayId,
    city_id: cityId,
    municipality_id: municipalityId,
  };
}

