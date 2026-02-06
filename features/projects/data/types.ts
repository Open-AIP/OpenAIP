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

// [DATAFLOW] `projectService` depends on this interface; swap adapters without touching UI/pages.
// [DBV2] Backing tables are `public.projects` + (`public.health_project_details` | `public.infrastructure_project_details`).
// [SECURITY] Reads must respect AIP visibility (`can_read_aip`); writes must respect edit window (`can_edit_aip` => draft/for_revision + owner/admin).
// [SUPABASE-SWAP] Implement a Supabase adapter that maps list/get operations to `public.projects` and relies on RLS for visibility.
export interface ProjectsRepo {
  listByAip(aipId: string): Promise<UiProject[]>;
  getById(projectId: string): Promise<UiProject | null>;
  listHealth(): Promise<HealthProject[]>;
  listInfrastructure(): Promise<InfrastructureProject[]>;
  getByRefCode(projectRefCode: string): Promise<ProjectBundle | null>;
}
