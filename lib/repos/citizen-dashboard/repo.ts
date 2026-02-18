import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockCitizenDashboardRepo } from "./repo.mock";
import type { CitizenDashboardRepo } from "./types";

export type { CitizenDashboardRepo, CitizenDashboardFilters, CitizenDashboardData } from "./types";

export function getCitizenDashboardRepo(): CitizenDashboardRepo {
  return selectRepo({
    label: "CitizenDashboardRepo",
    mock: () => createMockCitizenDashboardRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "CitizenDashboardRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}

