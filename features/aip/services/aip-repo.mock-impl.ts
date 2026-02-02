import type { AipRepo } from "../data/aip-repo";
import type { AipStatus, LguScope } from "../types";
import { AIPS_TABLE } from "../mock/aips.table";
import { generateMockAIP } from "./mock-aip-generator";

const aipDetailPromiseCache = new Map<string, ReturnType<AipRepo["getAipDetail"]>>();

export type CreateMockAipRepoOptions = {
  defaultScope?: LguScope;
};

export function createMockAipRepoImpl({
  defaultScope = "barangay",
}: CreateMockAipRepoOptions = {}): AipRepo {
  return {
    async listVisibleAips(
      { visibility = "my", scope }: { visibility?: "public" | "my"; scope?: LguScope } = {},
      _actor?: import("@/lib/domain/actor-context").ActorContext
    ) {
      const effectiveScope = scope ?? defaultScope;
      const filtered = AIPS_TABLE.filter((aip) => aip.scope === effectiveScope);
      if (visibility === "public") {
        return filtered.filter((aip) => aip.status !== "draft");
      }
      return filtered;
    },
    async getAipDetail(
      aipId: string,
      _actor?: import("@/lib/domain/actor-context").ActorContext
    ) {
      const cacheKey = `${defaultScope}:${aipId}`;
      const cached = aipDetailPromiseCache.get(cacheKey);
      if (cached) return cached;

      const promise = (async () => {
        const found = AIPS_TABLE.find((aip) => aip.id === aipId);
        if (found) return found;

        if (aipId.startsWith("aip-")) {
          const yearMatch = aipId.match(/aip-(\d{4})/);
          const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
          const fileName = `${aipId.split("-").slice(2, -1).join("-")}.pdf`;
          return generateMockAIP(aipId, fileName, year, defaultScope);
        }

        return null;
      })();

      aipDetailPromiseCache.set(cacheKey, promise);
      return promise;
    },
    async updateAipStatus(
      aipId: string,
      next: AipStatus,
      _actor?: import("@/lib/domain/actor-context").ActorContext
    ) {
      const index = AIPS_TABLE.findIndex((aip) => aip.id === aipId);
      if (index === -1) return;
      AIPS_TABLE[index] = { ...AIPS_TABLE[index], status: next };
    },
  };
}
