export type { ProjectsRepo } from "./types";
export { getProjectsRepo } from "./projectsRepo.selector";

export function createMockProjectsRepo() {
  return getProjectsRepo();
}
