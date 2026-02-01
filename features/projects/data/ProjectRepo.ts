import type {
  HealthProjectDetails,
  InfrastructureProjectDetails,
  ProjectMaster,
} from "../types";

export type Project = ProjectMaster;

export type HealthProjectDetailsInput = Omit<
  HealthProjectDetails,
  "projectRefCode"
>;

export type InfrastructureProjectDetailsInput = Omit<
  InfrastructureProjectDetails,
  "projectRefCode"
>;

export interface ProjectRepo {
  listByAipId(aipId: string): Promise<Project[]>;
  getById(projectId: string): Promise<Project | null>;
  updateProject(
    projectId: string,
    patch: Partial<Project>
  ): Promise<Project | null>;
  getHealthDetails(projectId: string): Promise<HealthProjectDetails | null>;
  upsertHealthDetails(
    projectId: string,
    payload: HealthProjectDetailsInput
  ): Promise<HealthProjectDetails>;
  getInfrastructureDetails(
    projectId: string
  ): Promise<InfrastructureProjectDetails | null>;
  upsertInfrastructureDetails(
    projectId: string,
    payload: InfrastructureProjectDetailsInput
  ): Promise<InfrastructureProjectDetails>;
}
