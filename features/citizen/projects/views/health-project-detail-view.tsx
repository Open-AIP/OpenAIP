"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProjectStatusBadgeClass } from "@/lib/ui/project-status";
import { ProjectUpdatesSection } from "@/components/projects/update-view";
import { CommentThreadsSplitView } from "@/components/feedback/comment-threads-split-view";
import { HealthProjectInformationCard } from "@/components/projects/health-project-information-card";
import type { HealthProject, ProjectUpdateUi } from "@/lib/repos/projects/types";

type Props = {
  aipYear: number;
  project: HealthProject;
};

export default function CitizenHealthProjectDetailView({ aipYear, project }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = searchParams.get("tab");
  const threadId = searchParams.get("thread");
  const activeTab = tab === "comments" ? "comments" : "updates";

  const breadcrumb = [
    { label: "Health Projects", href: "/projects/health" },
    { label: "Detail & Updates", href: "#" },
  ];

  const initialUpdates: ProjectUpdateUi[] = (project.updates ?? []).map((u) => ({
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
          <Badge
            variant="outline"
            className={`mt-auto rounded-full ${getProjectStatusBadgeClass(project.status)}`}
          >
            {project.status}
          </Badge>
        </div>
      </div>

      <HealthProjectInformationCard
        aipYear={aipYear}
        project={project}
        mode="citizen"
      />

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
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
        <ProjectUpdatesSection initialUpdates={initialUpdates} mode="citizen" />
      ) : (
        <CommentThreadsSplitView
          scope="barangay"
          mode="citizen"
          target={{ kind: "project", projectId: project.id }}
          selectedThreadId={threadId}
        />
      )}
    </div>
  );
}
