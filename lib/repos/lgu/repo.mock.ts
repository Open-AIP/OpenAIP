import { LGUS_TABLE } from "@/mocks/fixtures/lgu/lgus.table.fixture";
import type {
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

export function createMockLguRepoImpl(): LguRepo {
  return {
    async list(): Promise<LguRecord[]> {
      return [...LGUS_TABLE].sort((a, b) => a.name.localeCompare(b.name));
    },

    async create(input: CreateLguInput): Promise<LguRecord> {
      const record: LguRecord = {
        id: newId("lgu"),
        type: input.type,
        name: input.name,
        code: input.code,
        parentCityId: input.parentCityId ?? null,
        parentCityName: input.parentCityName ?? null,
        status: "active",
        updatedAt: todayYmd(),
      };
      LGUS_TABLE.unshift(record);
      return record;
    },

    async update(id: string, patch: UpdateLguInput): Promise<LguRecord> {
      const { idx, row } = getOrThrow(id);
      const next: LguRecord = {
        ...row,
        ...patch,
        updatedAt: todayYmd(),
      };
      LGUS_TABLE[idx] = next;
      return next;
    },

    async setStatus(id: string, status: LguStatus): Promise<LguRecord> {
      const { idx, row } = getOrThrow(id);
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
