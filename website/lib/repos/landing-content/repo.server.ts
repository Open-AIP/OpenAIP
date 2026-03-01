import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { LandingContentRepo } from "./repo";
import { createMockLandingContentRepo } from "./repo.mock";
import { createSupabaseLandingContentRepo } from "./repo.supabase";

export function getLandingContentRepo(): LandingContentRepo {
  return selectRepo({
    label: "LandingContentRepo",
    mock: () => createMockLandingContentRepo(),
    supabase: () => createSupabaseLandingContentRepo(),
  });
}
