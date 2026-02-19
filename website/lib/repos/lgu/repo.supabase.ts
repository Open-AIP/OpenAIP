import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import type {
  BarangayParentType,
  CreateLguInput,
  LguRecord,
  LguRepo,
  LguStatus,
  LguType,
  UpdateLguInput,
} from "./repo";

type RegionRow = {
  id: string;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type ProvinceRow = {
  id: string;
  region_id: string;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type CityRow = {
  id: string;
  region_id: string;
  province_id: string | null;
  psgc_code: string;
  name: string;
  is_independent: boolean;
  is_active: boolean;
  created_at: string;
};

type MunicipalityRow = {
  id: string;
  province_id: string;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type BarangayRow = {
  id: string;
  city_id: string | null;
  municipality_id: string | null;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

function toStatus(isActive: boolean): LguStatus {
  return isActive ? "active" : "deactivated";
}

function toYmd(isoDateTime: string) {
  return isoDateTime.slice(0, 10);
}

function tableForType(type: LguType) {
  if (type === "region") return "regions";
  if (type === "province") return "provinces";
  if (type === "city") return "cities";
  if (type === "municipality") return "municipalities";
  return "barangays";
}

function typeOrder(type: LguType) {
  if (type === "region") return 0;
  if (type === "province") return 1;
  if (type === "city") return 2;
  if (type === "municipality") return 3;
  return 4;
}

async function listLguRecords(): Promise<LguRecord[]> {
  const client = await supabaseServer();

  const [regionsResult, provincesResult, citiesResult, municipalitiesResult, barangaysResult] =
    await Promise.all([
      client
        .from("regions")
        .select("id,psgc_code,name,is_active,created_at")
        .order("name", { ascending: true }),
      client
        .from("provinces")
        .select("id,region_id,psgc_code,name,is_active,created_at")
        .order("name", { ascending: true }),
      client
        .from("cities")
        .select("id,region_id,province_id,psgc_code,name,is_independent,is_active,created_at")
        .order("name", { ascending: true }),
      client
        .from("municipalities")
        .select("id,province_id,psgc_code,name,is_active,created_at")
        .order("name", { ascending: true }),
      client
        .from("barangays")
        .select("id,city_id,municipality_id,psgc_code,name,is_active,created_at")
        .order("name", { ascending: true }),
    ]);

  if (regionsResult.error) throw new Error(regionsResult.error.message);
  if (provincesResult.error) throw new Error(provincesResult.error.message);
  if (citiesResult.error) throw new Error(citiesResult.error.message);
  if (municipalitiesResult.error) throw new Error(municipalitiesResult.error.message);
  if (barangaysResult.error) throw new Error(barangaysResult.error.message);

  const regions = (regionsResult.data ?? []) as RegionRow[];
  const provinces = (provincesResult.data ?? []) as ProvinceRow[];
  const cities = (citiesResult.data ?? []) as CityRow[];
  const municipalities = (municipalitiesResult.data ?? []) as MunicipalityRow[];
  const barangays = (barangaysResult.data ?? []) as BarangayRow[];

  const regionById = new Map(regions.map((r) => [r.id, r]));
  const provinceById = new Map(provinces.map((p) => [p.id, p]));
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const municipalityById = new Map(municipalities.map((m) => [m.id, m]));

  const rows: LguRecord[] = [];

  for (const row of regions) {
    rows.push({
      id: row.id,
      type: "region",
      name: row.name,
      code: row.psgc_code,
      parentType: null,
      parentId: null,
      parentName: null,
      regionId: null,
      regionName: null,
      provinceId: null,
      provinceName: null,
      cityId: null,
      cityName: null,
      municipalityId: null,
      municipalityName: null,
      isIndependent: null,
      status: toStatus(row.is_active),
      // DBV2 geo masters do not include updated_at; use created_at for UI date display.
      updatedAt: toYmd(row.created_at),
    });
  }

  for (const row of provinces) {
    const region = regionById.get(row.region_id);
    rows.push({
      id: row.id,
      type: "province",
      name: row.name,
      code: row.psgc_code,
      parentType: "region",
      parentId: row.region_id,
      parentName: region?.name ?? null,
      regionId: row.region_id,
      regionName: region?.name ?? null,
      provinceId: null,
      provinceName: null,
      cityId: null,
      cityName: null,
      municipalityId: null,
      municipalityName: null,
      isIndependent: null,
      status: toStatus(row.is_active),
      updatedAt: toYmd(row.created_at),
    });
  }

  for (const row of cities) {
    const region = regionById.get(row.region_id);
    const province = row.province_id ? provinceById.get(row.province_id) : null;
    rows.push({
      id: row.id,
      type: "city",
      name: row.name,
      code: row.psgc_code,
      parentType: province ? "province" : "region",
      parentId: province ? province.id : row.region_id,
      parentName: province ? province.name : (region?.name ?? null),
      regionId: row.region_id,
      regionName: region?.name ?? null,
      provinceId: row.province_id,
      provinceName: province?.name ?? null,
      cityId: null,
      cityName: null,
      municipalityId: null,
      municipalityName: null,
      isIndependent: row.is_independent,
      status: toStatus(row.is_active),
      updatedAt: toYmd(row.created_at),
    });
  }

  for (const row of municipalities) {
    const province = provinceById.get(row.province_id);
    const region = province ? regionById.get(province.region_id) : null;
    rows.push({
      id: row.id,
      type: "municipality",
      name: row.name,
      code: row.psgc_code,
      parentType: "province",
      parentId: row.province_id,
      parentName: province?.name ?? null,
      regionId: region?.id ?? null,
      regionName: region?.name ?? null,
      provinceId: row.province_id,
      provinceName: province?.name ?? null,
      cityId: null,
      cityName: null,
      municipalityId: null,
      municipalityName: null,
      isIndependent: null,
      status: toStatus(row.is_active),
      updatedAt: toYmd(row.created_at),
    });
  }

  for (const row of barangays) {
    if (row.city_id) {
      const city = cityById.get(row.city_id);
      const province = city?.province_id ? provinceById.get(city.province_id) : null;
      const region = city ? regionById.get(city.region_id) : null;
      rows.push({
        id: row.id,
        type: "barangay",
        name: row.name,
        code: row.psgc_code,
        parentType: "city",
        parentId: row.city_id,
        parentName: city?.name ?? null,
        regionId: region?.id ?? null,
        regionName: region?.name ?? null,
        provinceId: province?.id ?? null,
        provinceName: province?.name ?? null,
        cityId: row.city_id,
        cityName: city?.name ?? null,
        municipalityId: null,
        municipalityName: null,
        isIndependent: null,
        status: toStatus(row.is_active),
        updatedAt: toYmd(row.created_at),
      });
      continue;
    }

    const municipality = row.municipality_id
      ? municipalityById.get(row.municipality_id)
      : null;
    const province = municipality ? provinceById.get(municipality.province_id) : null;
    const region = province ? regionById.get(province.region_id) : null;
    rows.push({
      id: row.id,
      type: "barangay",
      name: row.name,
      code: row.psgc_code,
      parentType: "municipality",
      parentId: row.municipality_id,
      parentName: municipality?.name ?? null,
      regionId: region?.id ?? null,
      regionName: region?.name ?? null,
      provinceId: province?.id ?? null,
      provinceName: province?.name ?? null,
      cityId: null,
      cityName: null,
      municipalityId: row.municipality_id,
      municipalityName: municipality?.name ?? null,
      isIndependent: null,
      status: toStatus(row.is_active),
      updatedAt: toYmd(row.created_at),
    });
  }

  rows.sort((a, b) => {
    const typeDelta = typeOrder(a.type) - typeOrder(b.type);
    if (typeDelta !== 0) return typeDelta;
    return a.name.localeCompare(b.name);
  });

  return rows;
}

async function getLguTypeById(id: string): Promise<LguType> {
  const client = await supabaseServer();
  const checks: Array<{ type: LguType; table: string }> = [
    { type: "region", table: "regions" },
    { type: "province", table: "provinces" },
    { type: "city", table: "cities" },
    { type: "municipality", table: "municipalities" },
    { type: "barangay", table: "barangays" },
  ];

  for (const check of checks) {
    const { data, error } = await client.from(check.table).select("id").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return check.type;
  }

  throw new Error(`LGU not found: ${id}`);
}

async function getMergedById(id: string): Promise<LguRecord> {
  const rows = await listLguRecords();
  const row = rows.find((item) => item.id === id);
  if (!row) throw new Error(`LGU not found after write: ${id}`);
  return row;
}

async function assertNoActiveChildren(id: string, type: LguType): Promise<void> {
  const client = await supabaseServer();

  if (type === "region") {
    const [provincesResult, citiesResult] = await Promise.all([
      client.from("provinces").select("id").eq("region_id", id).eq("is_active", true).limit(1),
      client.from("cities").select("id").eq("region_id", id).eq("is_active", true).limit(1),
    ]);
    if (provincesResult.error) throw new Error(provincesResult.error.message);
    if (citiesResult.error) throw new Error(citiesResult.error.message);
    if ((provincesResult.data ?? []).length > 0 || (citiesResult.data ?? []).length > 0) {
      throw new Error("Cannot deactivate region while it still has active child LGUs.");
    }
    return;
  }

  if (type === "province") {
    const [citiesResult, municipalitiesResult] = await Promise.all([
      client.from("cities").select("id").eq("province_id", id).eq("is_active", true).limit(1),
      client
        .from("municipalities")
        .select("id")
        .eq("province_id", id)
        .eq("is_active", true)
        .limit(1),
    ]);
    if (citiesResult.error) throw new Error(citiesResult.error.message);
    if (municipalitiesResult.error) throw new Error(municipalitiesResult.error.message);
    if ((citiesResult.data ?? []).length > 0 || (municipalitiesResult.data ?? []).length > 0) {
      throw new Error("Cannot deactivate province while it still has active child LGUs.");
    }
    return;
  }

  if (type === "city") {
    const { data, error } = await client
      .from("barangays")
      .select("id")
      .eq("city_id", id)
      .eq("is_active", true)
      .limit(1);
    if (error) throw new Error(error.message);
    if ((data ?? []).length > 0) {
      throw new Error("Cannot deactivate city while it still has active child LGUs.");
    }
    return;
  }

  if (type === "municipality") {
    const { data, error } = await client
      .from("barangays")
      .select("id")
      .eq("municipality_id", id)
      .eq("is_active", true)
      .limit(1);
    if (error) throw new Error(error.message);
    if ((data ?? []).length > 0) {
      throw new Error("Cannot deactivate municipality while it still has active child LGUs.");
    }
  }
}

export function createSupabaseLguRepo(): LguRepo {
  return {
    async list(): Promise<LguRecord[]> {
      return listLguRecords();
    },

    async create(input: CreateLguInput): Promise<LguRecord> {
      const client = await supabaseServer();

      if (input.type === "region") {
        const { data, error } = await client
          .from("regions")
          .insert({
            name: input.name,
            psgc_code: input.code,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return getMergedById(data.id);
      }

      if (input.type === "province") {
        if (!input.regionId) throw new Error("Region is required for provinces.");
        const { data, error } = await client
          .from("provinces")
          .insert({
            region_id: input.regionId,
            name: input.name,
            psgc_code: input.code,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return getMergedById(data.id);
      }

      if (input.type === "city") {
        if (!input.regionId) throw new Error("Region is required for cities.");
        const provinceId = input.provinceId ?? null;
        const isIndependent =
          provinceId === null ? (input.isIndependent ?? true) : false;
        const { data, error } = await client
          .from("cities")
          .insert({
            region_id: input.regionId,
            province_id: provinceId,
            name: input.name,
            psgc_code: input.code,
            is_independent: isIndependent,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return getMergedById(data.id);
      }

      if (input.type === "municipality") {
        if (!input.provinceId) throw new Error("Province is required for municipalities.");
        const { data, error } = await client
          .from("municipalities")
          .insert({
            province_id: input.provinceId,
            name: input.name,
            psgc_code: input.code,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return getMergedById(data.id);
      }

      if (!input.parentType || !input.parentId) {
        throw new Error("Parent city or municipality is required for barangays.");
      }
      if (input.parentType === "city") {
        const { data, error } = await client
          .from("barangays")
          .insert({
            city_id: input.parentId,
            municipality_id: null,
            name: input.name,
            psgc_code: input.code,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return getMergedById(data.id);
      }

      const { data, error } = await client
        .from("barangays")
        .insert({
          city_id: null,
          municipality_id: input.parentId,
          name: input.name,
          psgc_code: input.code,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return getMergedById(data.id);
    },

    async update(id: string, patch: UpdateLguInput): Promise<LguRecord> {
      const client = await supabaseServer();
      const type = await getLguTypeById(id);

      if (type === "region") {
        const payload: Record<string, unknown> = {};
        if (typeof patch.name === "string") payload.name = patch.name;
        if (typeof patch.code === "string") payload.psgc_code = patch.code;
        const { error } = await client.from("regions").update(payload).eq("id", id);
        if (error) throw new Error(error.message);
        return getMergedById(id);
      }

      if (type === "province") {
        const payload: Record<string, unknown> = {};
        if (typeof patch.name === "string") payload.name = patch.name;
        if (typeof patch.code === "string") payload.psgc_code = patch.code;
        if (patch.regionId !== undefined) payload.region_id = patch.regionId;
        const { error } = await client.from("provinces").update(payload).eq("id", id);
        if (error) throw new Error(error.message);
        return getMergedById(id);
      }

      if (type === "city") {
        const payload: Record<string, unknown> = {};
        if (typeof patch.name === "string") payload.name = patch.name;
        if (typeof patch.code === "string") payload.psgc_code = patch.code;
        if (patch.regionId !== undefined) payload.region_id = patch.regionId;
        if (patch.provinceId !== undefined) {
          payload.province_id = patch.provinceId;
          payload.is_independent = patch.provinceId ? false : true;
        } else if (patch.isIndependent !== undefined) {
          payload.is_independent = patch.isIndependent;
        }
        const { error } = await client.from("cities").update(payload).eq("id", id);
        if (error) throw new Error(error.message);
        return getMergedById(id);
      }

      if (type === "municipality") {
        const payload: Record<string, unknown> = {};
        if (typeof patch.name === "string") payload.name = patch.name;
        if (typeof patch.code === "string") payload.psgc_code = patch.code;
        if (patch.provinceId !== undefined) payload.province_id = patch.provinceId;
        const { error } = await client
          .from("municipalities")
          .update(payload)
          .eq("id", id);
        if (error) throw new Error(error.message);
        return getMergedById(id);
      }

      const { data: current, error: currentError } = await client
        .from("barangays")
        .select("city_id,municipality_id")
        .eq("id", id)
        .single();
      if (currentError) throw new Error(currentError.message);

      const currentParentType: BarangayParentType = current.city_id
        ? "city"
        : "municipality";
      const nextParentType = (patch.parentType ?? currentParentType) as BarangayParentType;
      const nextParentId =
        patch.parentId ??
        (nextParentType === "city" ? current.city_id : current.municipality_id);
      if (!nextParentId) {
        throw new Error("Parent city or municipality is required for barangays.");
      }

      const payload: Record<string, unknown> = {
        city_id: nextParentType === "city" ? nextParentId : null,
        municipality_id:
          nextParentType === "municipality" ? nextParentId : null,
      };
      if (typeof patch.name === "string") payload.name = patch.name;
      if (typeof patch.code === "string") payload.psgc_code = patch.code;

      const { error } = await client.from("barangays").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return getMergedById(id);
    },

    async setStatus(id: string, status: LguStatus): Promise<LguRecord> {
      const client = await supabaseServer();
      const type = await getLguTypeById(id);

      if (status === "deactivated") {
        await assertNoActiveChildren(id, type);
      }

      const table = tableForType(type);
      const { error } = await client
        .from(table)
        .update({ is_active: status === "active" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return getMergedById(id);
    },
  };
}

