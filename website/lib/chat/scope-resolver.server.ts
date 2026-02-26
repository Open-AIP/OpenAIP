import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActorContext } from "@/lib/domain/actor-context";
import type { ScopeResolutionResult } from "./types";
import { parseScopeCue } from "./scope-parser";

type ScopeType = "barangay" | "city" | "municipality";

type ScopedPlace = {
  id: string;
  name: string;
};

type ResolveResult = {
  mode: ScopeResolutionResult["mode"];
  retrievalScope:
    | {
        mode: "global" | "own_barangay" | "named_scopes";
        targets: Array<{ scope_type: ScopeType; scope_id: string; scope_name: string }>;
      }
    | null;
  scopeResolution: ScopeResolutionResult;
  clarificationMessage?: string;
};

function normalizeLookupName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildOrIlikeClause(names: string[]): string {
  return names
    .map((name) => {
      const escaped = name.replace(/,/g, "\\,").replace(/\./g, "\\.");
      return `name.ilike.${escaped}`;
    })
    .join(",");
}

async function fetchPlacesByType(
  client: SupabaseClient,
  scopeType: ScopeType,
  names: string[]
): Promise<ScopedPlace[]> {
  if (!names.length) return [];

  const table =
    scopeType === "barangay" ? "barangays" : scopeType === "city" ? "cities" : "municipalities";
  const orClause = buildOrIlikeClause(names);
  if (!orClause) return [];

  const { data, error } = await client
    .from(table)
    .select("id,name")
    .eq("is_active", true)
    .or(orClause)
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => ({
      id: String((row as { id: string }).id ?? ""),
      name: String((row as { name: string }).name ?? "").trim(),
    }))
    .filter((row) => row.id && row.name);
}

async function resolveNamedTargets(
  client: SupabaseClient,
  requestedScopes: ScopeResolutionResult["requestedScopes"]
): Promise<{
  resolvedTargets: ScopeResolutionResult["resolvedTargets"];
  unresolvedScopes: string[];
  ambiguousScopes: Array<{ scopeName: string; candidateCount: number }>;
}> {
  const grouped = new Map<ScopeType, string[]>();
  for (const scope of requestedScopes) {
    const current = grouped.get(scope.scopeType) ?? [];
    if (!current.includes(scope.scopeName)) {
      current.push(scope.scopeName);
    }
    grouped.set(scope.scopeType, current);
  }

  const matchesByType = new Map<ScopeType, ScopedPlace[]>();
  for (const [scopeType, names] of grouped.entries()) {
    matchesByType.set(scopeType, await fetchPlacesByType(client, scopeType, names));
  }

  const resolvedTargets: ScopeResolutionResult["resolvedTargets"] = [];
  const unresolvedScopes: string[] = [];
  const ambiguousScopes: Array<{ scopeName: string; candidateCount: number }> = [];

  for (const requested of requestedScopes) {
    const lookup = normalizeLookupName(requested.scopeName);
    const candidates = (matchesByType.get(requested.scopeType) ?? []).filter(
      (candidate) => normalizeLookupName(candidate.name) === lookup
    );

    if (candidates.length === 0) {
      unresolvedScopes.push(`${requested.scopeType}:${requested.scopeName}`);
      continue;
    }

    if (candidates.length > 1) {
      ambiguousScopes.push({
        scopeName: `${requested.scopeType}:${requested.scopeName}`,
        candidateCount: candidates.length,
      });
      continue;
    }

    const candidate = candidates[0];
    const dedupeKey = `${requested.scopeType}:${candidate.id}`;
    if (
      resolvedTargets.some(
        (target) => `${target.scopeType}:${target.scopeId}`.toLowerCase() === dedupeKey.toLowerCase()
      )
    ) {
      continue;
    }

    resolvedTargets.push({
      scopeType: requested.scopeType,
      scopeId: candidate.id,
      scopeName: candidate.name,
    });
  }

  return { resolvedTargets, unresolvedScopes, ambiguousScopes };
}

async function resolveOwnBarangayTarget(client: SupabaseClient, barangayId: string) {
  const { data, error } = await client
    .from("barangays")
    .select("id,name")
    .eq("id", barangayId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return {
      scopeType: "barangay" as const,
      scopeId: barangayId,
      scopeName: "Your barangay",
    };
  }

  return {
    scopeType: "barangay" as const,
    scopeId: String((data as { id: string }).id),
    scopeName: String((data as { name: string }).name),
  };
}

export async function resolveRetrievalScope(input: {
  client: SupabaseClient;
  actor: ActorContext;
  question: string;
}): Promise<ResolveResult> {
  const { client, actor, question } = input;
  const parsed = parseScopeCue(question);

  if (parsed.requestedScopes.length > 0) {
    const { resolvedTargets, unresolvedScopes, ambiguousScopes } = await resolveNamedTargets(
      client,
      parsed.requestedScopes
    );

    if (unresolvedScopes.length > 0 || ambiguousScopes.length > 0 || resolvedTargets.length === 0) {
      return {
        mode: "ambiguous",
        retrievalScope: null,
        clarificationMessage:
          "I couldn't confidently match one or more place names. Please specify the exact barangay/city/municipality name.",
        scopeResolution: {
          mode: "ambiguous",
          requestedScopes: parsed.requestedScopes,
          resolvedTargets,
          unresolvedScopes,
          ambiguousScopes,
        },
      };
    }

    return {
      mode: "named_scopes",
      retrievalScope: {
        mode: "named_scopes",
        targets: resolvedTargets.map((target) => ({
          scope_type: target.scopeType,
          scope_id: target.scopeId,
          scope_name: target.scopeName,
        })),
      },
      scopeResolution: {
        mode: "named_scopes",
        requestedScopes: parsed.requestedScopes,
        resolvedTargets,
        unresolvedScopes: [],
        ambiguousScopes: [],
      },
    };
  }

  if (parsed.hasOwnBarangayCue && actor.scope.kind === "barangay" && actor.scope.id) {
    const target = await resolveOwnBarangayTarget(client, actor.scope.id);
    return {
      mode: "own_barangay",
      retrievalScope: {
        mode: "own_barangay",
        targets: [
          {
            scope_type: "barangay",
            scope_id: target.scopeId,
            scope_name: target.scopeName,
          },
        ],
      },
      scopeResolution: {
        mode: "own_barangay",
        requestedScopes: [],
        resolvedTargets: [target],
        unresolvedScopes: [],
        ambiguousScopes: [],
      },
    };
  }

  return {
    mode: "global",
    retrievalScope: {
      mode: "global",
      targets: [],
    },
    scopeResolution: {
      mode: "global",
      requestedScopes: [],
      resolvedTargets: [],
      unresolvedScopes: [],
      ambiguousScopes: [],
    },
  };
}
