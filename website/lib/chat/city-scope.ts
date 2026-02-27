import type { SupabaseClient } from "@supabase/supabase-js";

export type CityRef = {
  id: string;
  name: string;
};

export type CityScopeResult =
  | { kind: "none" }
  | { kind: "explicit_city"; city: CityRef; matchedBy: "label" | "name" };

type CityRow = {
  id: string;
  name: string | null;
};

type AipRow = {
  id: string;
  fiscal_year: number | null;
  created_at: string | null;
};

const CITY_NAME_STOP_PATTERN = /\b(?:fy|fiscal|year|total|investment|program|top|projects|budget|for|and)\b/i;

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function normalizeCityNameForMatch(name: string): string {
  return normalizeWhitespace(
    name
      .toLowerCase()
      .replace(/[()]/g, " ")
      .replace(/[.,;:!?'"`]/g, " ")
      .replace(/\bcity of\b/g, " ")
      .replace(/\bcity\b/g, " ")
  );
}

function cleanupCityCandidate(raw: string): string | null {
  const normalized = normalizeWhitespace(raw.replace(/[()]/g, " ").replace(/[.,;:!?'"`]/g, " "));
  if (!normalized) return null;
  const beforeStopWord = normalized.split(CITY_NAME_STOP_PATTERN)[0]?.trim() ?? normalized;
  if (!beforeStopWord) return null;
  return beforeStopWord;
}

export function detectExplicitCityMention(message: string): { cityNameCandidate: string | null } {
  const normalized = normalizeWhitespace(
    message
      .toLowerCase()
      .replace(/[()]/g, " ")
      .replace(/[.,;:!?'"`]/g, " ")
  );
  if (!normalized) {
    return { cityNameCandidate: null };
  }

  const cityOfMatch = normalized.match(/\bcity of\s+([a-z][a-z\s-]{1,80})\b/i);
  if (cityOfMatch?.[1]) {
    return { cityNameCandidate: cleanupCityCandidate(cityOfMatch[1]) };
  }

  const inCityMatch = normalized.match(/\b(?:in|for)\s+([a-z][a-z\s-]{1,80})\s+city\b/i);
  if (inCityMatch?.[1]) {
    return { cityNameCandidate: cleanupCityCandidate(inCityMatch[1]) };
  }

  const suffixCityMatch = normalized.match(/\b([a-z][a-z\s-]{1,80})\s+city\b/i);
  if (suffixCityMatch?.[1]) {
    return { cityNameCandidate: cleanupCityCandidate(suffixCityMatch[1]) };
  }

  return { cityNameCandidate: null };
}

export async function resolveCityByNameExact(
  supabaseAdminClient: SupabaseClient,
  candidateName: string
): Promise<CityRef | null> {
  const normalizedCandidate = normalizeCityNameForMatch(candidateName);
  if (!normalizedCandidate) return null;

  const { data, error } = await supabaseAdminClient
    .from("cities")
    .select("id,name")
    .eq("is_active", true)
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CityRow[];
  const matches = rows.filter((row) => {
    const rawName = (row.name ?? "").trim();
    if (!rawName) return false;
    return normalizeCityNameForMatch(rawName) === normalizedCandidate;
  });

  if (matches.length !== 1) {
    return null;
  }

  const match = matches[0];
  return {
    id: match.id,
    name: (match.name ?? "").trim(),
  };
}

export async function selectPublishedCityAip(
  supabaseAdminClient: SupabaseClient,
  cityId: string,
  fiscalYear: number | null
): Promise<{ aipId: string | null; fiscalYearFound: number | null }> {
  let query = supabaseAdminClient
    .from("aips")
    .select("id,fiscal_year,created_at")
    .eq("status", "published")
    .eq("city_id", cityId);

  if (fiscalYear !== null) {
    query = query.eq("fiscal_year", fiscalYear).order("created_at", { ascending: false });
  } else {
    query = query.order("fiscal_year", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  const row = (data as AipRow | null) ?? null;
  if (!row?.id) {
    return { aipId: null, fiscalYearFound: null };
  }

  return {
    aipId: row.id,
    fiscalYearFound: typeof row.fiscal_year === "number" ? row.fiscal_year : null,
  };
}

export async function listBarangayIdsInCity(
  supabaseAdminClient: SupabaseClient,
  cityId: string
): Promise<string[]> {
  const { data, error } = await supabaseAdminClient
    .from("barangays")
    .select("id")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  const ids = (data ?? [])
    .map((row) => {
      const typed = row as { id?: unknown };
      return typeof typed.id === "string" ? typed.id : null;
    })
    .filter((id): id is string => Boolean(id));

  return ids.filter((id, index, all) => all.indexOf(id) === index);
}
