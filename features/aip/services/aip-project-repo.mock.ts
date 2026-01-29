import { AIP_PROJECT_ROWS_TABLE } from "../mock/aip-project-rows.table";
import type { AipProjectRepo } from "../data/aip-project-repo";
import { generateMockProjects } from "./mock-aip-generator";

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
