import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockCitizenAipRepo } from "./repo.mock";
import type { CitizenAipRepo } from "./types";

export function getCitizenAipRepo(): CitizenAipRepo {
  return selectRepo({
    label: "CitizenAipRepo",
    mock: () => createMockCitizenAipRepo(),
    supabase: () => {
      throw new Error("CitizenAipRepo is not implemented for Supabase yet.");
    },
  });
}
