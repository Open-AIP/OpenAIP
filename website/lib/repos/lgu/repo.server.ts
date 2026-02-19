import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { LguRepo } from "./repo";
import { createMockLguRepoImpl } from "./repo.mock";
import { createSupabaseLguRepo } from "./repo.supabase";

export function getLguRepo(): LguRepo {
  return selectRepo({
    label: "LguRepo",
    mock: () => createMockLguRepoImpl(),
    supabase: () => createSupabaseLguRepo(),
  });
}

