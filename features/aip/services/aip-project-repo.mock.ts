import { AIP_PROJECT_ROWS_TABLE } from "../mock/aip-project-rows.table";
import type { AipProjectRepo } from "../data/aip-project-repo";
import { generateMockProjects } from "./mock-aip-generator";

// [DATAFLOW] Mock adapter for `AipProjectRepo` used in `dev` via `getAipProjectRepo()`.
// [DBV2] In Supabase, `listByAip()` should query `public.projects` by `aip_id` (plus detail joins) and be gated by `can_read_aip`.
// [SUPABASE-SWAP] `submitReview()` should become an insert into `public.feedback` (lgu_note), not a no-op.
export function createMockAipProjectRepo(): AipProjectRepo {
  return {
    async listByAip(aipId: string) {
      // Check if we have existing projects
      const existingProjects = AIP_PROJECT_ROWS_TABLE.filter((row) => row.aipId === aipId);
      
      // If no projects found and it's a mock upload (starts with 'aip-'), generate mock projects
      if (existingProjects.length === 0 && aipId.startsWith("aip-")) {
        // Extract year from aipId (format: aip-{year}-{name}-{timestamp})
        const yearMatch = aipId.match(/aip-(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        
        return generateMockProjects(aipId, year, 6);
      }
      
      return existingProjects;
    },
    async submitReview() {
      // No-op for mock data; UI updates optimistically.
    },
  };
}
