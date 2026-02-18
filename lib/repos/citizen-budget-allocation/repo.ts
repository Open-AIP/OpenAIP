import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockCitizenBudgetAllocationRepo } from "./repo.mock";
import type { CitizenBudgetAllocationRepo } from "./types";

export type { BudgetAllocationFilters, BudgetAllocationData, CitizenBudgetAllocationRepo } from "./types";

export function getCitizenBudgetAllocationRepo(): CitizenBudgetAllocationRepo {
  return selectRepo({
    label: "CitizenBudgetAllocationRepo",
    mock: () => createMockCitizenBudgetAllocationRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "CitizenBudgetAllocationRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}
