"use client";

import type { InfrastructureProject, ProjectUpdate } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ProjectUpdatesSection } from "../shared/update-view";
import InfrastructureProjectInformationCard from "./project-information-card";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";

export default function InfrastructureProjectDetailPageView({
  aipYear,
  project,
}: {
  aipYear: number;
  project: InfrastructureProject;
}) {
  const breadcrumb = [
    { label: "Infrastructure Project", href: "/barangay/projects/infrastructure" },
    { label: "Detail & Updates", href: "#" },
  ];

  function statusPill(status: InfrastructureProject["status"]) {
    switch (status) {
      case "Ongoing":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Planning":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Completed":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "On Hold":
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  }

  // ✅ Adapt Infrastructure updates to shared ProjectUpdate (only fields needed by shared UI)
  const initialUpdates: ProjectUpdate[] = (project.updates ?? []).map(
    (u: NonNullable<InfrastructureProject["updates"]>[number]): ProjectUpdate => ({
      id: u.id,
      title: u.title,
      date: u.date,
      description: u.description,
      progressPercent: u.progressPercent,
      photoUrls: u.photoUrls,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-stretch justify-between gap-4">
        <div className="min-w-0">
          <BreadcrumbNav items={breadcrumb} />

          <h1 className="mt-2 text-3xl font-bold text-slate-900">{project.title}</h1>
        </div>

        <div className="flex flex-col items-end">
          <Badge variant="outline" className={`mt-auto rounded-full ${statusPill(project.status)}`}>
            {project.status}
          </Badge>
        </div>
      </div>

      <InfrastructureProjectInformationCard aipYear={aipYear} project={project} />

      {/* ✅ Shared updates UI (timeline + form) */}
      <ProjectUpdatesSection initialUpdates={initialUpdates} />
    </div>
  );
}
