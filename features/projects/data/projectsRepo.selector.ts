import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { ProjectsRepo } from "./types";
import { createMockProjectsRepoImpl } from "./repos/project.repo.mock";

export function getProjectsRepo(): ProjectsRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockProjectsRepoImpl();
  }

  throw new NotImplementedError(
    `ProjectsRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
