import { NotImplementedError } from "@/lib/core/errors";
import type { LandingContentVM } from "@/lib/domain/landing-content";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockLandingContentRepo } from "./repo.mock";

export interface LandingContentRepo {
  getLandingContent(): Promise<LandingContentVM>;
}

export function getLandingContentRepo(): LandingContentRepo {
  return selectRepo({
    label: "LandingContentRepo",
    mock: () => createMockLandingContentRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "LandingContentRepo Supabase adapter is TODO. Map DBv2-backed landing dashboard projections before enabling."
      );
    },
  });
}

