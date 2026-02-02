import { getProjectsRepo } from "./projectsRepo.selector";

export type { ProjectsRepo } from "./types";
export { getProjectsRepo };

export function createMockProjectsRepo() {
  return getProjectsRepo();
}
