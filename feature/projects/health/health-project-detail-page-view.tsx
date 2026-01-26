/**
 * Health Project Detail Page View Component
 * 
 * Comprehensive detail page for health projects.
 * Displays project information and integrates shared project updates functionality.
 * Adapts health-specific update data to the shared update interface.
 * 
 * @module feature/projects/health/health-project-detail-page-view
 */

"use client";

import * as React from "react";
import type { HealthProject, ProjectUpdate } from "@/types";
import ProjectInformationCard from "./project-information-card";
import { Badge } from "@/components/ui/badge";
import { ProjectUpdatesSection } from "../shared/update-view";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { getProjectStatusBadgeClass } from "@/lib/utils/ui-helpers";

/**
 * HealthProjectDetailPageView Component
 * 
 * Main detail view for health projects.
 * Features:
 * - Breadcrumb navigation
 * - Project title and status badge
 * - Project information card
 * - Shared project updates section (timeline + form)
 * 
 * Adapts health-specific update format to shared ProjectUpdate type
 * for compatibility with shared update components.
 * 
 * @param aipYear - The AIP year for context
 * @param project - Complete health project data
 * @param scope - Administrative scope (city or barangay)
 */
export default function HealthProjectDetailPageView({
  aipYear,
  project,
  scope = "barangay"
}: {
  aipYear: number;
  project: HealthProject;
  scope?: "city" | "barangay";
}) {
  const breadcrumb = [
    { label: "Health Project", href: `/${scope}/projects/health` },
    { label: "Detail & Updates", href: "#" },
  ];

  // ✅ Adapt Health updates to shared ProjectUpdate (only fields needed by shared UI)
  const initialUpdates: ProjectUpdate[] = (project.updates ?? []).map((u: HealthProject['updates'][number]): ProjectUpdate => ({
    id: u.id,
    title: u.title,
    date: u.date,
    description: u.description,
    progressPercent: u.progressPercent,
    photoUrls: u.photoUrls,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-stretch justify-between gap-4">
        <div className="min-w-0">
          <BreadcrumbNav items={breadcrumb} />

          <h1 className="mt-2 text-3xl font-bold text-slate-900">{project.title}</h1>
        </div>

        <div className="flex flex-col items-end">
          <Badge variant="outline" className={`mt-auto rounded-full ${getProjectStatusBadgeClass(project.status)}`}>
            {project.status}
          </Badge>
        </div>
      </div>

      <ProjectInformationCard aipYear={aipYear} project={project} scope={scope} />

      {/* ✅ Shared updates UI (timeline + form) */}
      <ProjectUpdatesSection initialUpdates={initialUpdates} />
    </div>
  );
}
