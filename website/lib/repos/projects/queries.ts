import "server-only";

import { getProjectsRepo } from "./repo.server";
import type { HealthProject, InfrastructureProject, ProjectReadOptions } from "./repo";

// [DATAFLOW] Page/server components → `projectService` → `ProjectsRepo` → adapter (mock now; Supabase later).
// [DBV2] When backed by Supabase, the repo must enforce `can_read_project`/`can_edit_project` semantics (via RLS + explicit filters for UX).
export const projectService = {
  async getHealthProjects(options?: ProjectReadOptions): Promise<HealthProject[]> {
    const repo = getProjectsRepo();
    return repo.listHealth(options);
  },

  async getInfrastructureProjects(options?: ProjectReadOptions): Promise<InfrastructureProject[]> {
    const repo = getProjectsRepo();
    return repo.listInfrastructure(options);
  },

  async getHealthProjectById(
    projectRefCode: string,
    options?: ProjectReadOptions
  ): Promise<HealthProject | null> {
    const repo = getProjectsRepo();
    const project = await repo.getById(projectRefCode, options);
    if (!project || project.kind !== "health") {
      return null;
    }
    return project as HealthProject;
  },

  async getInfrastructureProjectById(
    projectRefCode: string,
    options?: ProjectReadOptions
  ): Promise<InfrastructureProject | null> {
    const repo = getProjectsRepo();
    const project = await repo.getById(projectRefCode, options);
    if (!project || project.kind !== "infrastructure") {
      return null;
    }
    return project as InfrastructureProject;
  },

  async getProjectBundle(projectRefCode: string, options?: ProjectReadOptions) {
    const repo = getProjectsRepo();
    return repo.getByRefCode(projectRefCode, options);
  },

  async getProjectsByAip(aipId: string, options?: ProjectReadOptions) {
    const repo = getProjectsRepo();
    const projects = await repo.listByAip(aipId, options);
    return projects.filter(
      (project) => project.kind === "health" || project.kind === "infrastructure"
    ) as (HealthProject | InfrastructureProject)[];
  },

  async searchProjects(query: string, options?: ProjectReadOptions) {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth(options)),
      ...(await repo.listInfrastructure(options)),
    ];

    const lowerQuery = query.toLowerCase();
    return allProjects.filter((project) =>
      project.title.toLowerCase().includes(lowerQuery)
    );
  },

  async getProjectsByStatus(
    status: "planning" | "ongoing" | "completed" | "on_hold",
    options?: ProjectReadOptions
  ) {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth(options)),
      ...(await repo.listInfrastructure(options)),
    ];

    return allProjects.filter((project) => project.status === status);
  },

  async getProjectsByYear(year: number, options?: ProjectReadOptions) {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth(options)),
      ...(await repo.listInfrastructure(options)),
    ];

    return allProjects.filter((project) => project.year === year);
  },
};
