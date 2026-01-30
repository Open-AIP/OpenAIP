/**
 * ============================================================================
 * PROJECTS FEATURE - SERVICE LAYER
 * ============================================================================
 * 
 * Business logic layer for Projects feature.
 * Provides high-level operations for fetching and managing project data.
 * ============================================================================
 */

import { createMockProjectsRepo } from "./project-repo-mock";
import type { HealthProject, InfrastructureProject } from "../types";

const projectRepository = createMockProjectsRepo();

export const projectService = {
  /**
   * Get all health projects
   */
  async getHealthProjects(): Promise<HealthProject[]> {
    return projectRepository.listHealth();
  },

  /**
   * Get all infrastructure projects
   */
  async getInfrastructureProjects(): Promise<InfrastructureProject[]> {
    return projectRepository.listInfrastructure();
  },

  /**
   * Get a specific health project by ID (reference code)
   */
  async getHealthProjectById(projectRefCode: string): Promise<HealthProject | null> {
    const project = await projectRepository.getByRefCode(projectRefCode);
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
    const project = await projectRepository.getByRefCode(projectRefCode);
    if (!project || project.kind !== "infrastructure") {
      return null;
    }
    return project as InfrastructureProject;
  },

  /**
   * Get a project bundle (master + details + updates) by reference code
   */
  async getProjectBundle(projectRefCode: string): Promise<HealthProject | InfrastructureProject | null> {
    return projectRepository.getByRefCode(projectRefCode);
  },

  /**
   * Search projects by title
   */
  async searchProjects(query: string): Promise<(HealthProject | InfrastructureProject)[]> {
    const allProjects = [
      ...(await projectRepository.listHealth()),
      ...(await projectRepository.listInfrastructure()),
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
    const allProjects = [
      ...(await projectRepository.listHealth()),
      ...(await projectRepository.listInfrastructure()),
    ];
    
    return allProjects.filter((project) => project.status === status);
  },

  /**
   * Get projects by year
   */
  async getProjectsByYear(year: number): Promise<(HealthProject | InfrastructureProject)[]> {
    const allProjects = [
      ...(await projectRepository.listHealth()),
      ...(await projectRepository.listInfrastructure()),
    ];
    
    return allProjects.filter((project) => project.year === year);
  },
};
