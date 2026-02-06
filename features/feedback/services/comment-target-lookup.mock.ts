import { projectRepository } from "@/features/projects/services";
import { AIPS_TABLE } from "@/features/aip/mock/aips.table";
import { AIP_PROJECT_ROWS_TABLE } from "@/features/aip/mock/aip-project-rows.table";
import type { CommentTargetLookup } from "./resolve-comment-sidebar";

export function createMockCommentTargetLookup(): CommentTargetLookup {
  return {
    async getProject(id) {
      const project = await projectRepository.getByRefCode(id);
      if (!project) return null;
      return {
        id: project.id,
        title: project.title,
        year: project.year,
        kind: project.kind,
      };
    },

    async getAip(id) {
      const aip = AIPS_TABLE.find((item) => item.id === id);
      if (!aip) return null;
      return {
        id: aip.id,
        title: aip.title,
        year: aip.year,
        barangayName: aip.barangayName ?? null,
      };
    },

    async getAipItem(aipId, aipItemId) {
      const item = AIP_PROJECT_ROWS_TABLE.find(
        (row) => row.aipId === aipId && row.id === aipItemId
      );
      if (!item) return null;
      return {
        id: item.id,
        aipId: item.aipId,
        projectRefCode: item.projectRefCode,
        aipDescription: item.aipDescription,
      };
    },

    async findAipItemByProjectRefCode(projectRefCode) {
      const item = AIP_PROJECT_ROWS_TABLE.find(
        (row) => row.projectRefCode === projectRefCode
      );
      if (!item) return null;
      return {
        id: item.id,
        aipId: item.aipId,
        projectRefCode: item.projectRefCode,
        aipDescription: item.aipDescription,
      };
    },
  };
}
