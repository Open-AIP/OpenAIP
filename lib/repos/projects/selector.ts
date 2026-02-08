import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { ProjectsRepo } from "./repo";
import { createMockProjectsRepoImpl } from "./repo.mock";

export function getProjectsRepo(): ProjectsRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockProjectsRepoImpl();
  }

  // [SUPABASE-SWAP] Add a `ProjectsRepo` Supabase adapter and switch here; keep UI/services unchanged.
  throw new NotImplementedError(
    `ProjectsRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}

