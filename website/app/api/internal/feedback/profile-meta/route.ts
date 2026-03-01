import { NextResponse } from "next/server";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  role: "citizen" | "barangay_official" | "city_official" | "municipal_official" | "admin" | null;
  full_name: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

type NameRow = {
  id: string;
  name: string;
};

function parseIds(url: URL): string[] {
  const raw = url.searchParams.get("ids")?.trim();
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  ).slice(0, 200);
}

export async function GET(request: Request) {
  try {
    const actor = await getActorContext();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (
      actor.role !== "barangay_official" &&
      actor.role !== "city_official" &&
      actor.role !== "municipal_official" &&
      actor.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const url = new URL(request.url);
    const ids = parseIds(url);
    if (ids.length === 0) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const admin = supabaseAdmin();
    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .select("id,role,full_name,barangay_id,city_id,municipality_id")
      .in("id", ids);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const profiles = (profileData ?? []) as ProfileRow[];

    const barangayIds = Array.from(
      new Set(
        profiles
          .map((profile) => profile.barangay_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );
    const cityIds = Array.from(
      new Set(
        profiles
          .map((profile) => profile.city_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );
    const municipalityIds = Array.from(
      new Set(
        profiles
          .map((profile) => profile.municipality_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );

    const [barangayResult, cityResult, municipalityResult] = await Promise.all([
      barangayIds.length
        ? admin.from("barangays").select("id,name").in("id", barangayIds)
        : Promise.resolve({ data: [], error: null }),
      cityIds.length
        ? admin.from("cities").select("id,name").in("id", cityIds)
        : Promise.resolve({ data: [], error: null }),
      municipalityIds.length
        ? admin.from("municipalities").select("id,name").in("id", municipalityIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (barangayResult.error) {
      return NextResponse.json({ error: barangayResult.error.message }, { status: 500 });
    }
    if (cityResult.error) {
      return NextResponse.json({ error: cityResult.error.message }, { status: 500 });
    }
    if (municipalityResult.error) {
      return NextResponse.json({ error: municipalityResult.error.message }, { status: 500 });
    }

    const barangayNameById = new Map(
      ((barangayResult.data ?? []) as NameRow[]).map((row) => [row.id, row.name])
    );
    const cityNameById = new Map(
      ((cityResult.data ?? []) as NameRow[]).map((row) => [row.id, row.name])
    );
    const municipalityNameById = new Map(
      ((municipalityResult.data ?? []) as NameRow[]).map((row) => [row.id, row.name])
    );

    return NextResponse.json(
      {
        items: profiles.map((profile) => ({
          id: profile.id,
          role: profile.role,
          full_name: profile.full_name,
          barangay_id: profile.barangay_id,
          city_id: profile.city_id,
          municipality_id: profile.municipality_id,
          barangay_name: profile.barangay_id
            ? barangayNameById.get(profile.barangay_id) ?? null
            : null,
          city_name: profile.city_id ? cityNameById.get(profile.city_id) ?? null : null,
          municipality_name: profile.municipality_id
            ? municipalityNameById.get(profile.municipality_id) ?? null
            : null,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load profile metadata.",
      },
      { status: 500 }
    );
  }
}
