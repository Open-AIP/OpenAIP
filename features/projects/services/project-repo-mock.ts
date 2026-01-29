import { PROJECTS_TABLE } from "@/features/projects/mock/projects-table";
import { getProjectBundleByRefCode } from "@/lib/mockdb";
import type { ProjectMaster } from "../types";

export type ProjectBundle = Awaited<ReturnType<typeof getProjectBundleByRefCode>>;

export function createMockProjectsRepo() {
  return {
    async list(kind?: ProjectMaster["kind"]) {
      return kind ? PROJECTS_TABLE.filter((p) => p.kind === kind) : PROJECTS_TABLE;
    },

    async getByRefCode(projectRefCode: string) {
      return getProjectBundleByRefCode(projectRefCode);
    },
  };
}
