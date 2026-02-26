import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockProjectsRepoImpl } from "./repo.mock";
import type {
  HealthProject,
  InfrastructureProject,
  ProjectReadOptions,
  ProjectBundle,
  UiProject,
} from "./types";

export type {
  BarangayProjectScope,
  HealthProject,
  HealthProjectDetails,
  InfrastructureProject,
  InfrastructureProjectDetails,
  OtherProject,
  ProjectBundle,
  ProjectKind,
  ProjectMaster,
  ProjectReadOptions,
  ProjectStatus,
  ProjectUpdate,
  ProjectUpdateUi,
  UiProject,
} from "./types";

export { PROJECT_STATUS_VALUES } from "./types";

// [DATAFLOW] `projectService` depends on this interface; swap adapters without touching UI/pages.
// [DBV2] Backing tables are `public.projects` + (`public.health_project_details` | `public.infrastructure_project_details`).
// [SECURITY] Reads must respect AIP visibility (`can_read_aip`); writes must respect edit window (`can_edit_aip` => draft/for_revision + owner/admin).
// [SUPABASE-SWAP] Implement a Supabase adapter that maps list/get operations to `public.projects` and relies on RLS for visibility.
export interface ProjectsRepo {
  listByAip(aipId: string, options?: ProjectReadOptions): Promise<UiProject[]>;
  getById(projectId: string, options?: ProjectReadOptions): Promise<UiProject | null>;
  listHealth(options?: ProjectReadOptions): Promise<HealthProject[]>;
  listInfrastructure(options?: ProjectReadOptions): Promise<InfrastructureProject[]>;
  getByRefCode(
    projectRefCode: string,
    options?: ProjectReadOptions
  ): Promise<ProjectBundle | null>;
}

export function getProjectsRepo(): ProjectsRepo {
  return selectRepo({
    label: "ProjectsRepo",
    mock: () => createMockProjectsRepoImpl(),
    supabase: () => {
      throw new NotImplementedError(
        "ProjectsRepo is server-only outside mock mode. Import from `@/lib/repos/projects/repo.server`."
      );
    },
  });
}
