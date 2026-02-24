import "server-only";

import { getAipRepo } from "@/lib/repos/aip/repo.server";
import type { CitizenAipRepo } from "./types";

const DEFAULT_LGU_LABEL = "Barangay";

export function createMockCitizenAipRepo(): CitizenAipRepo {
  return {
    async getDefaultLguLabel() {
      const repo = getAipRepo({ defaultScope: "barangay" });
      const aips = await repo.listVisibleAips({
        visibility: "public",
        scope: "barangay",
      });

      for (const aip of aips) {
        const label = aip.barangayName?.trim();
        if (label) return label;
      }

      return DEFAULT_LGU_LABEL;
    },
  };
}

