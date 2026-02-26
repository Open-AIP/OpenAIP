import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import { getAipRepo } from "@/lib/repos/aip/repo.server";
import { createMockCitizenAipRepo } from "./repo.mock";
import type { CitizenAipRepo } from "./types";

const DEFAULT_LGU_LABEL = "Barangay";

function createSupabaseCitizenAipRepo(): CitizenAipRepo {
  return {
    async getDefaultLguLabel() {
      const repo = getAipRepo();
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

export function getCitizenAipRepo(): CitizenAipRepo {
  return selectRepo({
    label: "CitizenAipRepo",
    mock: () => createMockCitizenAipRepo(),
    supabase: () => createSupabaseCitizenAipRepo(),
  });
}

