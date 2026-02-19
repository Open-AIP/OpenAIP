import { LGUS_TABLE } from "@/mocks/fixtures/lgu/lgus.table.fixture";
import type {
  BarangayParentType,
  CreateLguInput,
  LguRecord,
  LguRepo,
  LguStatus,
  UpdateLguInput,
} from "./repo";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function newId(prefix = "lgu") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getOrThrow(id: string) {
  const idx = LGUS_TABLE.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`LGU not found: ${id}`);
  return { idx, row: LGUS_TABLE[idx] };
}

function getByTypeAndId(type: LguRecord["type"], id: string) {
  const row = LGUS_TABLE.find((r) => r.type === type && r.id === id);
  if (!row) {
    throw new Error(`${type} not found: ${id}`);
  }
  return row;
}

function hasActiveChildren(row: LguRecord) {
  if (row.type === "region") {
    return LGUS_TABLE.some(
      (child) =>
        child.status === "active" &&
        ((child.type === "province" && child.regionId === row.id) ||
          (child.type === "city" && child.regionId === row.id))
    );
  }
  if (row.type === "province") {
    return LGUS_TABLE.some(
      (child) =>
        child.status === "active" &&
        ((child.type === "city" && child.provinceId === row.id) ||
          (child.type === "municipality" && child.provinceId === row.id))
    );
  }
  if (row.type === "city") {
    return LGUS_TABLE.some(
      (child) =>
        child.status === "active" && child.type === "barangay" && child.cityId === row.id
    );
  }
  if (row.type === "municipality") {
    return LGUS_TABLE.some(
      (child) =>
        child.status === "active" &&
        child.type === "barangay" &&
        child.municipalityId === row.id
    );
  }
  return false;
}

export function createMockLguRepoImpl(): LguRepo {
  return {
    async list(): Promise<LguRecord[]> {
      const typeOrder: Record<LguRecord["type"], number> = {
        region: 0,
        province: 1,
        city: 2,
        municipality: 3,
        barangay: 4,
      };
      return [...LGUS_TABLE].sort((a, b) => {
        const typeDelta = typeOrder[a.type] - typeOrder[b.type];
        if (typeDelta !== 0) return typeDelta;
        return a.name.localeCompare(b.name);
      });
    },

    async create(input: CreateLguInput): Promise<LguRecord> {
      const base: Omit<
        LguRecord,
        | "id"
        | "type"
        | "name"
        | "code"
        | "status"
        | "updatedAt"
      > = {
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
      };

      if (input.type === "province") {
        if (!input.regionId) throw new Error("Region is required for provinces.");
        const region = getByTypeAndId("region", input.regionId);
        base.parentType = "region";
        base.parentId = region.id;
        base.parentName = region.name;
        base.regionId = region.id;
        base.regionName = region.name;
      } else if (input.type === "city") {
        if (!input.regionId) throw new Error("Region is required for cities.");
        const region = getByTypeAndId("region", input.regionId);
        base.regionId = region.id;
        base.regionName = region.name;
        if (input.provinceId) {
          const province = getByTypeAndId("province", input.provinceId);
          base.parentType = "province";
          base.parentId = province.id;
          base.parentName = province.name;
          base.provinceId = province.id;
          base.provinceName = province.name;
          base.isIndependent = false;
        } else {
          base.parentType = "region";
          base.parentId = region.id;
          base.parentName = region.name;
          base.isIndependent = true;
        }
      } else if (input.type === "municipality") {
        if (!input.provinceId) throw new Error("Province is required for municipalities.");
        const province = getByTypeAndId("province", input.provinceId);
        base.parentType = "province";
        base.parentId = province.id;
        base.parentName = province.name;
        base.provinceId = province.id;
        base.provinceName = province.name;
        base.regionId = province.regionId ?? null;
        base.regionName = province.regionName ?? null;
      } else if (input.type === "barangay") {
        if (!input.parentType || !input.parentId) {
          throw new Error("Parent city or municipality is required for barangays.");
        }
        if (input.parentType === "city") {
          const city = getByTypeAndId("city", input.parentId);
          base.parentType = "city";
          base.parentId = city.id;
          base.parentName = city.name;
          base.cityId = city.id;
          base.cityName = city.name;
          base.provinceId = city.provinceId ?? null;
          base.provinceName = city.provinceName ?? null;
          base.regionId = city.regionId ?? null;
          base.regionName = city.regionName ?? null;
        } else {
          const municipality = getByTypeAndId("municipality", input.parentId);
          base.parentType = "municipality";
          base.parentId = municipality.id;
          base.parentName = municipality.name;
          base.municipalityId = municipality.id;
          base.municipalityName = municipality.name;
          base.provinceId = municipality.provinceId ?? null;
          base.provinceName = municipality.provinceName ?? null;
          base.regionId = municipality.regionId ?? null;
          base.regionName = municipality.regionName ?? null;
        }
      }

      const record: LguRecord = {
        id: newId("lgu"),
        type: input.type,
        name: input.name,
        code: input.code,
        ...base,
        status: "active",
        updatedAt: todayYmd(),
      };
      LGUS_TABLE.unshift(record);
      return record;
    },

    async update(id: string, patch: UpdateLguInput): Promise<LguRecord> {
      const { idx, row } = getOrThrow(id);
      const next: LguRecord = { ...row };

      if (typeof patch.name === "string") next.name = patch.name;
      if (typeof patch.code === "string") next.code = patch.code;

      if (row.type === "province") {
        if (patch.regionId) {
          const region = getByTypeAndId("region", patch.regionId);
          next.parentType = "region";
          next.parentId = region.id;
          next.parentName = region.name;
          next.regionId = region.id;
          next.regionName = region.name;
        }
      } else if (row.type === "city") {
        if (patch.regionId) {
          const region = getByTypeAndId("region", patch.regionId);
          next.regionId = region.id;
          next.regionName = region.name;
        }
        if (patch.provinceId !== undefined) {
          if (patch.provinceId) {
            const province = getByTypeAndId("province", patch.provinceId);
            next.parentType = "province";
            next.parentId = province.id;
            next.parentName = province.name;
            next.provinceId = province.id;
            next.provinceName = province.name;
            next.isIndependent = false;
          } else {
            const region = getByTypeAndId("region", next.regionId ?? "");
            next.parentType = "region";
            next.parentId = region.id;
            next.parentName = region.name;
            next.provinceId = null;
            next.provinceName = null;
            next.isIndependent = true;
          }
        }
      } else if (row.type === "municipality") {
        if (patch.provinceId) {
          const province = getByTypeAndId("province", patch.provinceId);
          next.parentType = "province";
          next.parentId = province.id;
          next.parentName = province.name;
          next.provinceId = province.id;
          next.provinceName = province.name;
          next.regionId = province.regionId ?? null;
          next.regionName = province.regionName ?? null;
        }
      } else if (row.type === "barangay") {
        const nextParentType = (patch.parentType ?? row.parentType) as
          | BarangayParentType
          | null;
        const nextParentId = patch.parentId ?? row.parentId;
        if (nextParentType && nextParentId) {
          if (nextParentType === "city") {
            const city = getByTypeAndId("city", nextParentId);
            next.parentType = "city";
            next.parentId = city.id;
            next.parentName = city.name;
            next.cityId = city.id;
            next.cityName = city.name;
            next.municipalityId = null;
            next.municipalityName = null;
            next.provinceId = city.provinceId ?? null;
            next.provinceName = city.provinceName ?? null;
            next.regionId = city.regionId ?? null;
            next.regionName = city.regionName ?? null;
          } else {
            const municipality = getByTypeAndId("municipality", nextParentId);
            next.parentType = "municipality";
            next.parentId = municipality.id;
            next.parentName = municipality.name;
            next.cityId = null;
            next.cityName = null;
            next.municipalityId = municipality.id;
            next.municipalityName = municipality.name;
            next.provinceId = municipality.provinceId ?? null;
            next.provinceName = municipality.provinceName ?? null;
            next.regionId = municipality.regionId ?? null;
            next.regionName = municipality.regionName ?? null;
          }
        }
      }

      next.updatedAt = todayYmd();
      LGUS_TABLE[idx] = next;
      return next;
    },

    async setStatus(id: string, status: LguStatus): Promise<LguRecord> {
      const { idx, row } = getOrThrow(id);
      if (status === "deactivated" && hasActiveChildren(row)) {
        throw new Error(
          `Cannot deactivate ${row.type} "${row.name}" while it still has active children.`
        );
      }
      const next: LguRecord = {
        ...row,
        status,
        updatedAt: todayYmd(),
      };
      LGUS_TABLE[idx] = next;
      return next;
    },
  };
}
