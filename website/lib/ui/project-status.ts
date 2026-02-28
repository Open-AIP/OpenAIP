import type { ProjectStatus } from "@/lib/repos/projects/types";

export function getProjectStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case "ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "proposed":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "completed":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "on_hold":
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}
