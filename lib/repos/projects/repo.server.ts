import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { ProjectsRepo } from "./repo";
import { createMockProjectsRepoImpl } from "./repo.mock";
import { createSupabaseProjectsRepo } from "./repo.supabase";

export function getProjectsRepo(): ProjectsRepo {
  return selectRepo({
    label: "ProjectsRepo",
    mock: () => createMockProjectsRepoImpl(),
    supabase: () => createSupabaseProjectsRepo(),
  });
}

