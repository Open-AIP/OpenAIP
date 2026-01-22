"use client";

import * as React from "react";
import type { HealthProject, HealthProjectUpdate } from "@/types";
import ProjectInformationCard from "./update-view-features/project-information-card";
import UpdatesTimelineView from "./update-view-features/updates-timeline-view";
import PostUpdateForm from "./update-view-features/post-update-form";

export default function HealthProjectDetailPageView({
  aipYear,
  project,
}: {
  aipYear: number;
  project: HealthProject;
}) {
  const [updates, setUpdates] = React.useState<HealthProjectUpdate[]>(
    [...(project.updates ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  );

  return (
    <div className="space-y-6">
      <ProjectInformationCard aipYear={aipYear} project={project} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <UpdatesTimelineView updates={updates} />

        <PostUpdateForm
          onCreate={(u) => {
            setUpdates((prev) => [u, ...prev]);
          }}
        />
      </div>
    </div>
  );
}
