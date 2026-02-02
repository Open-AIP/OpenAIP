import type {
  HealthProject,
  InfrastructureProject,
  ProjectBundle,
} from "../types";

export interface ProjectsRepo {
  listHealth(): Promise<HealthProject[]>;
  listInfrastructure(): Promise<InfrastructureProject[]>;
  getByRefCode(projectRefCode: string): Promise<ProjectBundle | null>;
}
