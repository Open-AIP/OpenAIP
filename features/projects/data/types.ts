import type {
  HealthProject,
  InfrastructureProject,
  ProjectBundle,
} from "../types";

export interface ProjectsRepo {
  listByAip(aipId: string): Promise<(HealthProject | InfrastructureProject)[]>;
  getById(projectId: string): Promise<ProjectBundle | null>;
  listHealth(): Promise<HealthProject[]>;
  listInfrastructure(): Promise<InfrastructureProject[]>;
  getByRefCode(projectRefCode: string): Promise<ProjectBundle | null>;
}
