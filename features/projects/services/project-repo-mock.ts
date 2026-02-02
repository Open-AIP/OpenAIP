import type { ProjectsRepo } from "../data/projectsRepo";
import { createMockProjectsRepo } from "../data/projectsRepo";

export { createMockProjectsRepo };

// Export singleton instance
export const projectRepository: ProjectsRepo = createMockProjectsRepo();
