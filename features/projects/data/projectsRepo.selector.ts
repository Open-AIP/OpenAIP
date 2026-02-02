import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { ProjectsRepo } from "./types";
import { createMockProjectsRepoImpl } from "./projectsRepo.mockImpl";

export function getProjectsRepo(): ProjectsRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockProjectsRepoImpl();
  }

  throw new NotImplementedError(
    `ProjectsRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
