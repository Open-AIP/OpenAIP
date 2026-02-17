/**
 * Infrastructure Project Detail Page View Component
 * 
 * Comprehensive detail page for infrastructure projects.
 * Displays project information and integrates shared project updates functionality.
 * Adapts infrastructure-specific update data to the shared update interface.
 * 
 * @module feature/projects/infrastructure/infrastructure-project-detail-page-view
 */

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { InfrastructureProject, ProjectUpdateUi } from "@/features/projects/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { getProjectStatusBadgeClass } from "@/lib/ui/project-status";
import InfrastructureProjectInformationCard from "../components/project-information-card";
import { ProjectUpdatesSection } from "../../shared/update-view";
import { CommentThreadsSplitView } from "@/components/feedback/comment-threads-split-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { PRIMARY_BUTTON_CLASS } from "@/constants/theme";

/**
 * InfrastructureProjectDetailPageView Component
 * 
 * Main detail view for infrastructure projects.
 * Features:
 * - Breadcrumb navigation
 * - Project title and status badge
 * - Project information card
 * - Shared project updates section (timeline + form)
 * 
 * Adapts infrastructure-specific update format to shared ProjectUpdate type
 * for compatibility with shared update components.
 * 
 * @param aipYear - The AIP year for context
 * @param project - Complete infrastructure project data
 * @param scope - Administrative scope (city or barangay)
 */
export default function InfrastructureProjectDetailPageView({
  aipYear,
  project,
  scope = "barangay"
}: {
  aipYear: number;
  project: InfrastructureProject;
  scope?: "city" | "barangay";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = searchParams.get("tab");
  const threadId = searchParams.get("thread");
  const activeTab = tab === "comments" ? "comments" : "updates";

  const breadcrumb = [
    { label: "Infrastructure Project", href: `/${scope}/projects/infrastructure` },
    { label: "Detail & Updates", href: "#" },
  ];
  const defaultImplementingOffice =
    scope === "city" ? "City Engineering Office" : "Barangay Engineering Office";

  // ✅ Adapt Infrastructure updates to shared ProjectUpdate (only fields needed by shared UI)
  const initialUpdates: ProjectUpdateUi[] = (project.updates ?? []).map(
    (u: NonNullable<InfrastructureProject["updates"]>[number]): ProjectUpdateUi => ({
      id: u.id,
      title: u.title,
      date: u.date,
      description: u.description,
      progressPercent: u.progressPercent ?? 0,
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
          <Badge variant="outline" className={`mt-auto rounded-full ${getProjectStatusBadgeClass(project.status)}`}>
            {project.status}
          </Badge>
        </div>
      </div>

      <InfrastructureProjectInformationCard
        aipYear={aipYear}
        project={project}
        defaultImplementingOffice={defaultImplementingOffice}
        actionSlot={
          <Button asChild className={PRIMARY_BUTTON_CLASS}>
            <Link href={`/${scope}/projects/infrastructure/${project.id}/add-information`}>
              <Plus className="w-4 h-4 mr-2" />
              Add Information
            </Link>
          </Button>
        }
      />

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
