import type { AipProjectRepo, AipRepo, AipStatus, LguScope } from "./repo";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";
import { generateMockAIP, generateMockProjects } from "./mock-aip-generator";

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
      if (!aipId) return null;

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

export function createMockAipRepo(options: CreateMockAipRepoOptions = {}): AipRepo {
  return createMockAipRepoImpl(options);
}

export function createMockAipProjectRepo(): AipProjectRepo {
  return {
    async listByAip(aipId: string) {
      const existingProjects = AIP_PROJECT_ROWS_TABLE.filter((row) => row.aipId === aipId);

      if (existingProjects.length === 0 && aipId.startsWith("aip-")) {
        const yearMatch = aipId.match(/aip-(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

        return generateMockProjects(aipId, year, 6);
      }

      return existingProjects;
    },
    async submitReview() {
      // No-op for mock data; UI updates optimistically.
    },
  };
}
