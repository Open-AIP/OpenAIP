import { NotImplementedError } from "@/lib/core/errors";
import type {
  LandingContentQuery,
  LandingContentResult,
} from "@/lib/domain/landing-content";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockLandingContentRepo } from "./repo.mock";

export interface LandingContentRepo {
  getLandingContent(input?: LandingContentQuery): Promise<LandingContentResult>;
}

export function getLandingContentRepo(): LandingContentRepo {
  return selectRepo({
    label: "LandingContentRepo",
    mock: () => createMockLandingContentRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "LandingContentRepo is server-only outside mock mode. Import from `@/lib/repos/landing-content/repo.server`."
      );
    },
  });
}

