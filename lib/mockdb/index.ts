import { AIPS_TABLE } from "@/features/aip/mock/aips.table";
import { AIP_PROJECT_ROWS_TABLE } from "@/features/aip/mock/aip-project-rows.table";
import { PROJECTS_TABLE } from "@/features/projects/mock/projects-table";
import { HEALTH_DETAILS_TABLE } from "@/features/projects/mock/health-details-table";
import { INFRA_DETAILS_TABLE } from "@/features/projects/mock/infrastructure-details-table";
import { PROJECT_UPDATES_TABLE } from "@/features/projects/mock/project-updates-table";

export function getAipById(aipId: string) {
  return AIPS_TABLE.find(a => a.id === aipId) ?? null;
}

export function listAips(scope?: "barangay" | "city") {
  return scope ? AIPS_TABLE.filter(a => a.scope === scope) : AIPS_TABLE;
}

export function getProjectBundleByRefCode(projectRefCode: string) {
  const master = PROJECTS_TABLE.find(p => p.projectRefCode === projectRefCode) ?? null;
  if (!master) return null;

  const updates = PROJECT_UPDATES_TABLE.filter(u => u.projectRefCode === projectRefCode);

  if (master.kind === "health") {
    const details = HEALTH_DETAILS_TABLE.find(d => d.projectRefCode === projectRefCode) ?? null;
    return { ...master, details, updates };
  }

  const details = INFRA_DETAILS_TABLE.find(d => d.projectRefCode === projectRefCode) ?? null;
  return { ...master, details, updates };
}

export function getAipDetailView(aipId: string) {
  const aip = getAipById(aipId);
  if (!aip) return null;

  const rows = AIP_PROJECT_ROWS_TABLE
    .filter(r => r.aipId === aipId)
    .map(row => ({ row, project: getProjectBundleByRefCode(row.projectRefCode) }));

  return { aip, rows };
}
