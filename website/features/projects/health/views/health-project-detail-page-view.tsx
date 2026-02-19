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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HealthProject, ProjectUpdateUi } from "@/features/projects/types";
import ProjectInformationCard from "../components/project-information-card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { getProjectStatusBadgeClass } from "@/features/projects/utils/status-badges";
import { ProjectUpdatesSection } from "../../shared/update-view";
import { CommentThreadsSplitView } from "@/features/feedback";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = searchParams.get("tab");
  const threadId = searchParams.get("thread");
  const activeTab = tab === "comments" ? "comments" : "updates";

  const breadcrumb = [
    { label: "Health Project", href: `/${scope}/projects/health` },
    { label: "Detail & Updates", href: "#" },
  ];

  // ✅ Adapt Health updates to shared ProjectUpdate (only fields needed by shared UI)
  const initialUpdates: ProjectUpdateUi[] = (project.updates ?? []).map((u: HealthProject["updates"][number]): ProjectUpdateUi => ({
    id: u.id,
    title: u.title,
    date: u.date,
    description: u.description,
    progressPercent: u.progressPercent ?? 0,
    photoUrls: u.photoUrls,
    attendanceCount: u.attendanceCount,
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
      <div className="flex items-center gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "comments") {
              params.set("tab", "comments");
              params.delete("thread");
            } else {
              params.delete("tab");
              params.delete("thread");
            }
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            });
          }}
        >
          <TabsList className="h-10 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="updates"
              className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Updates Timeline
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              onClick={() => {
                if (activeTab !== "comments") return;
                const params = new URLSearchParams(searchParams.toString());
                params.set("tab", "comments");
                params.delete("thread");
                const query = params.toString();
                router.replace(query ? `${pathname}?${query}` : pathname, {
                  scroll: false,
                });
              }}
            >
              Feedback
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "updates" ? (
        <ProjectUpdatesSection initialUpdates={initialUpdates} />
      ) : (
        <CommentThreadsSplitView
          scope={scope}
          target={{ kind: "project", projectId: project.id }}
          selectedThreadId={threadId}
        />
      )}

    </div>
  );
}
