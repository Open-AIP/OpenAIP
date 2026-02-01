import type { AipRepo } from "../data/aip-repo";
import type { AipStatus, LguScope } from "../types";
import { AIPS_TABLE } from "../mock/aips.table";
import { generateMockAIP } from "./mock-aip-generator";

export type CreateMockAipRepoOptions = {
  defaultScope?: LguScope;
};

export function createMockAipRepoImpl({
  defaultScope = "barangay",
}: CreateMockAipRepoOptions = {}): AipRepo {
  return {
    async listVisibleAips(
      { visibility = "my", scope }: { visibility?: "public" | "my"; scope?: LguScope } = {}
    ) {
      const effectiveScope = scope ?? defaultScope;
      const filtered = AIPS_TABLE.filter((aip) => aip.scope === effectiveScope);
      if (visibility === "public") {
        return filtered.filter((aip) => aip.status !== "draft");
      }
      return filtered;
    },
    async getAipDetail(aipId: string) {
      const found = AIPS_TABLE.find((aip) => aip.id === aipId);
      if (found) return found;

      if (aipId.startsWith("aip-")) {
        const yearMatch = aipId.match(/aip-(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        const fileName = `${aipId.split("-").slice(2, -1).join("-")}.pdf`;
        return generateMockAIP(aipId, fileName, year, defaultScope);
      }

      return null;
    },
    async updateAipStatus(aipId: string, next: AipStatus) {
      const index = AIPS_TABLE.findIndex((aip) => aip.id === aipId);
      if (index === -1) return;
      AIPS_TABLE[index] = { ...AIPS_TABLE[index], status: next };
    },
  };
}
