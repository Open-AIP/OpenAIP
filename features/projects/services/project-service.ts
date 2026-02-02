/**
 * ============================================================================
 * PROJECTS FEATURE - SERVICE LAYER
 * ============================================================================
 * 
 * Business logic layer for Projects feature.
 * Provides high-level operations for fetching and managing project data.
 * ============================================================================
 */

import { getProjectsRepo } from "../data/projectsRepo";
import type { HealthProject, InfrastructureProject } from "../types";

export const projectService = {
  /**
   * Get all health projects
   */
  async getHealthProjects(): Promise<HealthProject[]> {
    const repo = getProjectsRepo();
    return repo.listHealth();
  },

  /**
   * Get all infrastructure projects
   */
  async getInfrastructureProjects(): Promise<InfrastructureProject[]> {
    const repo = getProjectsRepo();
    return repo.listInfrastructure();
  },

  /**
   * Get a specific health project by ID (reference code)
   */
  async getHealthProjectById(projectRefCode: string): Promise<HealthProject | null> {
    const repo = getProjectsRepo();
    const project = await repo.getByRefCode(projectRefCode);
    if (!project || project.kind !== "health") {
      return null;
    }
    return project as HealthProject;
  },

  /**
   * Get a specific infrastructure project by ID (reference code)
   */
  async getInfrastructureProjectById(
    projectRefCode: string
  ): Promise<InfrastructureProject | null> {
    const repo = getProjectsRepo();
    const project = await repo.getByRefCode(projectRefCode);
    if (!project || project.kind !== "infrastructure") {
      return null;
    }
    return project as InfrastructureProject;
  },

  /**
   * Get a project bundle (master + details + updates) by reference code
   */
  async getProjectBundle(projectRefCode: string): Promise<HealthProject | InfrastructureProject | null> {
    const repo = getProjectsRepo();
    return repo.getByRefCode(projectRefCode);
  },

  /**
   * Search projects by title
   */
  async searchProjects(query: string): Promise<(HealthProject | InfrastructureProject)[]> {
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

  /**
   * Get projects by status
   */
  async getProjectsByStatus(
    status: "planning" | "ongoing" | "completed" | "on_hold"
  ): Promise<(HealthProject | InfrastructureProject)[]> {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth()),
      ...(await repo.listInfrastructure()),
    ];
    
    return allProjects.filter((project) => project.status === status);
  },

  /**
   * Get projects by year
   */
  async getProjectsByYear(year: number): Promise<(HealthProject | InfrastructureProject)[]> {
    const repo = getProjectsRepo();
    const allProjects = [
      ...(await repo.listHealth()),
      ...(await repo.listInfrastructure()),
    ];
    
    return allProjects.filter((project) => project.year === year);
  },
};
