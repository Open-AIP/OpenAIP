import type { RoleType } from "@/lib/contracts/databasev2";
import { supabaseServer } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;

export type CitizenProfileRow = {
  id: string;
  role: RoleType | null;
  full_name: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

type BarangayRow = {
  id: string;
  name: string;
  city_id: string | null;
  municipality_id: string | null;
  is_active: boolean;
};

type CityRow = {
  id: string;
  name: string;
  province_id: string | null;
  is_active: boolean;
};

type MunicipalityRow = {
  id: string;
  name: string;
  province_id: string | null;
  is_active: boolean;
};

type ProvinceRow = {
  id: string;
  name: string;
  is_active: boolean;
};

export type ResolveCitizenBarangayInput = {
  barangay: string;
  city: string;
  province: string;
};

export type ResolveCitizenBarangayResult =
  | {
      ok: true;
      value: {
        barangayId: string;
        barangayName: string;
        cityOrMunicipalityName: string;
        provinceName: string;
      };
    }
  | {
      ok: false;
      errorMessage: string;
    };

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getCitizenProfileByUserId(
  client: SupabaseServerClient,
  userId: string
): Promise<CitizenProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id,role,full_name,barangay_id,city_id,municipality_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CitizenProfileRow | null) ?? null;
}

export function isCitizenProfileComplete(profile: CitizenProfileRow | null): boolean {
  if (!profile) return false;
  if (profile.role !== "citizen") return false;
  if (!toNonEmptyString(profile.full_name)) return false;
  if (!profile.barangay_id) return false;
  return true;
}

export async function resolveCitizenBarangayByNames(
  client: SupabaseServerClient,
  input: ResolveCitizenBarangayInput
): Promise<ResolveCitizenBarangayResult> {
  const normalizedBarangay = normalizeName(input.barangay);
  const normalizedCity = normalizeName(input.city);
  const normalizedProvince = normalizeName(input.province);

  const { data: barangayData, error: barangayError } = await client
    .from("barangays")
    .select("id,name,city_id,municipality_id,is_active")
    .ilike("name", input.barangay.trim())
    .eq("is_active", true)
    .limit(100);

  if (barangayError) {
    throw new Error(barangayError.message);
  }

  const barangays = ((barangayData ?? []) as BarangayRow[]).filter(
    (row) => normalizeName(row.name) === normalizedBarangay
  );

  if (barangays.length === 0) {
    return {
      ok: false,
      errorMessage: "The selected barangay could not be found.",
    };
  }

  const cityIds = Array.from(
    new Set(
      barangays
        .map((row) => row.city_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );
  const municipalityIds = Array.from(
    new Set(
      barangays
        .map((row) => row.municipality_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [citiesResult, municipalitiesResult] = await Promise.all([
    cityIds.length
      ? client
          .from("cities")
          .select("id,name,province_id,is_active")
          .in("id", cityIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
    municipalityIds.length
      ? client
          .from("municipalities")
          .select("id,name,province_id,is_active")
          .in("id", municipalityIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (citiesResult.error) {
    throw new Error(citiesResult.error.message);
  }
  if (municipalitiesResult.error) {
    throw new Error(municipalitiesResult.error.message);
  }

  const cities = (citiesResult.data ?? []) as CityRow[];
  const municipalities = (municipalitiesResult.data ?? []) as MunicipalityRow[];
  const cityById = new Map(cities.map((row) => [row.id, row]));
  const municipalityById = new Map(municipalities.map((row) => [row.id, row]));

  const provinceIds = Array.from(
    new Set(
      [...cities, ...municipalities]
        .map((row) => row.province_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const provincesResult = provinceIds.length
    ? await client
        .from("provinces")
        .select("id,name,is_active")
        .in("id", provinceIds)
        .eq("is_active", true)
    : { data: [], error: null };

  if (provincesResult.error) {
    throw new Error(provincesResult.error.message);
  }

  const provinces = (provincesResult.data ?? []) as ProvinceRow[];
  const provinceById = new Map(provinces.map((row) => [row.id, row]));

  const matched = barangays
    .map((row) => {
      const city = row.city_id ? cityById.get(row.city_id) : null;
      const municipality = row.municipality_id
        ? municipalityById.get(row.municipality_id)
        : null;
      const cityOrMunicipalityName = city?.name ?? municipality?.name ?? null;
      const provinceId = city?.province_id ?? municipality?.province_id ?? null;
      const provinceName = provinceId ? provinceById.get(provinceId)?.name ?? null : null;

      if (!cityOrMunicipalityName || !provinceName) {
        return null;
      }

      if (normalizeName(cityOrMunicipalityName) !== normalizedCity) {
        return null;
      }
      if (normalizeName(provinceName) !== normalizedProvince) {
        return null;
      }

      return {
        barangayId: row.id,
        barangayName: row.name,
        cityOrMunicipalityName,
        provinceName,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  if (matched.length === 0) {
    return {
      ok: false,
      errorMessage:
        "Barangay, city, and province do not match our records. Please check your entries.",
    };
  }

  if (matched.length > 1) {
    return {
      ok: false,
      errorMessage:
        "Multiple barangay matches were found for the provided location. Please use a more specific location.",
    };
  }

  return {
    ok: true,
    value: matched[0],
  };
}
