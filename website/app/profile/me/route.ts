import { fail, ok } from "@/lib/auth/citizen-auth-route";
import { splitCitizenFullName } from "@/lib/auth/citizen-profile-completion";
import { supabaseServer } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  email: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

type BarangayRow = {
  id: string;
  name: string;
  city_id: string | null;
  municipality_id: string | null;
};

type CityRow = {
  id: string;
  name: string;
  province_id: string | null;
};

type MunicipalityRow = {
  id: string;
  name: string;
  province_id: string | null;
};

type ProvinceRow = {
  id: string;
  name: string;
};

function toNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function loadBarangayById(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  id: string
): Promise<BarangayRow | null> {
  const { data, error } = await client
    .from("barangays")
    .select("id,name,city_id,municipality_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as BarangayRow | null) ?? null;
}

async function loadCityById(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  id: string
): Promise<CityRow | null> {
  const { data, error } = await client
    .from("cities")
    .select("id,name,province_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CityRow | null) ?? null;
}

async function loadMunicipalityById(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  id: string
): Promise<MunicipalityRow | null> {
  const { data, error } = await client
    .from("municipalities")
    .select("id,name,province_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as MunicipalityRow | null) ?? null;
}

async function loadProvinceById(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  id: string
): Promise<ProvinceRow | null> {
  const { data, error } = await client
    .from("provinces")
    .select("id,name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProvinceRow | null) ?? null;
}

export async function GET() {
  try {
    const client = await supabaseServer();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user?.id) {
      return fail("Authentication required.", 401);
    }

    const { data: profileData, error: profileError } = await client
      .from("profiles")
      .select("id,role,full_name,email,barangay_id,city_id,municipality_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      return fail(profileError.message, 500);
    }

    const profile = (profileData as ProfileRow | null) ?? null;
    if (!profile) {
      return fail("Citizen profile not found.", 404);
    }
    if (profile.role !== "citizen") {
      return fail("This endpoint is only for citizen accounts.", 403);
    }
    if (!profile.barangay_id) {
      return fail("Citizen profile not found.", 404);
    }

    const barangay = await loadBarangayById(client, profile.barangay_id);
    if (!barangay) {
      return fail("Citizen profile not found.", 404);
    }

    const cityCandidateIds = Array.from(
      new Set(
        [profile.city_id, barangay.city_id].filter(
          (value): value is string => typeof value === "string" && value.length > 0
        )
      )
    );

    let cityName: string | null = null;
    let provinceId: string | null = null;

    for (const cityId of cityCandidateIds) {
      const city = await loadCityById(client, cityId);
      if (city && toNonEmptyString(city.name) && city.province_id) {
        cityName = city.name;
        provinceId = city.province_id;
        break;
      }
    }

    if (!cityName || !provinceId) {
      const municipalityCandidateIds = Array.from(
        new Set(
          [profile.municipality_id, barangay.municipality_id].filter(
            (value): value is string => typeof value === "string" && value.length > 0
          )
        )
      );

      for (const municipalityId of municipalityCandidateIds) {
        const municipality = await loadMunicipalityById(client, municipalityId);
        if (municipality && toNonEmptyString(municipality.name) && municipality.province_id) {
          cityName = municipality.name;
          provinceId = municipality.province_id;
          break;
        }
      }
    }

    if (!cityName || !provinceId) {
      return fail("Unable to resolve citizen profile location.", 500);
    }

    const province = await loadProvinceById(client, provinceId);
    const provinceName = toNonEmptyString(province?.name);
    if (!provinceName) {
      return fail("Unable to resolve citizen profile location.", 500);
    }

    const fullName =
      toNonEmptyString(profile.full_name) ??
      toNonEmptyString(
        [authData.user.user_metadata.first_name, authData.user.user_metadata.last_name]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(" ")
      ) ??
      "Citizen User";
    const { firstName, lastName } = splitCitizenFullName(fullName);

    return ok({
      fullName,
      email: profile.email ?? authData.user.email ?? "",
      firstName,
      lastName,
      barangay: barangay.name,
      city: cityName,
      province: provinceName,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load account profile.", 500);
  }
}
