import "server-only";

import { getProjectsRepo } from "./repo.server";
import type { HealthProject, InfrastructureProject } from "./repo";

// [DATAFLOW] Page/server components → `projectService` → `ProjectsRepo` → adapter (mock now; Supabase later).
// [DBV2] When backed by Supabase, the repo must enforce `can_read_project`/`can_edit_project` semantics (via RLS + explicit filters for UX).
export const projectService = {
  async getHealthProjects(): Promise<HealthProject[]> {
    const repo = getProjectsRepo();
    return repo.listHealth();
  },

  async getInfrastructureProjects(): Promise<InfrastructureProject[]> {
    const repo = getProjectsRepo();
    return repo.listInfrastructure();
  },

  async getHealthProjectById(projectRefCode: string): Promise<HealthProject | null> {
    const repo = getProjectsRepo();
    const project = await repo.getById(projectRefCode);
    if (!project || project.kind !== "health") {
      return null;
    }
    return project as HealthProject;
  },

  async getInfrastructureProjectById(
    projectRefCode: string
  ): Promise<InfrastructureProject | null> {
    const repo = getProjectsRepo();
    const project = await repo.getById(projectRefCode);
    if (!project || project.kind !== "infrastructure") {
      return null;
    }
    return project as InfrastructureProject;
  },

  async getProjectBundle(projectRefCode: string) {
    const repo = getProjectsRepo();
    return repo.getByRefCode(projectRefCode);
  },

  async getProjectsByAip(aipId: string) {
    const repo = getProjectsRepo();
    const projects = await repo.listByAip(aipId);
    return projects.filter(
      (project) => project.kind === "health" || project.kind === "infrastructure"
    ) as (HealthProject | InfrastructureProject)[];
  },

  async searchProjects(query: string) {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth()),
      ...(await repo.listInfrastructure()),
    ];

    const lowerQuery = query.toLowerCase();
    return allProjects.filter((project) =>
      project.title.toLowerCase().includes(lowerQuery)
    );
  },

  async getProjectsByStatus(status: "planning" | "ongoing" | "completed" | "on_hold") {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth()),
      ...(await repo.listInfrastructure()),
    ];

    return allProjects.filter((project) => project.status === status);
  },

  async getProjectsByYear(year: number) {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth()),
      ...(await repo.listInfrastructure()),
    ];

    return allProjects.filter((project) => project.year === year);
  },
};
