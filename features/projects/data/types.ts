import type {
  HealthProject,
  InfrastructureProject,
  ProjectBundle,
  ProjectUpdate,
} from "../types";

export type OtherProject = {
  id: string;
  projectRefCode: string;
  year: number;
  kind: "other";
  title: string;
  status: "planning" | "ongoing" | "completed" | "on_hold";
  imageUrl?: string;
  updates: ProjectUpdate[];
};

export type UiProject = HealthProject | InfrastructureProject | OtherProject;

export interface ProjectsRepo {
  listByAip(aipId: string): Promise<UiProject[]>;
  getById(projectId: string): Promise<UiProject | null>;
  listHealth(): Promise<HealthProject[]>;
  listInfrastructure(): Promise<InfrastructureProject[]>;
  getByRefCode(projectRefCode: string): Promise<ProjectBundle | null>;
}
