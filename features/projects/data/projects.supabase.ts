import type {
  HealthProjectDetails,
  InfrastructureProjectDetails,
} from "../types";
import type {
  HealthProjectDetailsInput,
  InfrastructureProjectDetailsInput,
  Project,
  ProjectRepo,
} from "./ProjectRepo";

export function createSupabaseProjectRepo(): ProjectRepo {
  return {
    async listByAipId(_aipId: string): Promise<Project[]> {
      throw new Error("Not implemented");
    },

    async getById(_projectId: string): Promise<Project | null> {
      throw new Error("Not implemented");
    },

    async updateProject(
      _projectId: string,
      _patch: Partial<Project>
    ): Promise<Project | null> {
      throw new Error("Not implemented");
    },

    async getHealthDetails(
      _projectId: string
    ): Promise<HealthProjectDetails | null> {
      throw new Error("Not implemented");
    },

    async upsertHealthDetails(
      _projectId: string,
      _payload: HealthProjectDetailsInput
    ): Promise<HealthProjectDetails> {
      throw new Error("Not implemented");
    },

    async getInfrastructureDetails(
      _projectId: string
    ): Promise<InfrastructureProjectDetails | null> {
      throw new Error("Not implemented");
    },

    async upsertInfrastructureDetails(
      _projectId: string,
      _payload: InfrastructureProjectDetailsInput
    ): Promise<InfrastructureProjectDetails> {
      throw new Error("Not implemented");
    },
  };
}
