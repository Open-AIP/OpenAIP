"use client";

import * as React from "react";
import type { ProjectUpdate } from "@/types";
import UpdatesTimelineView from "./updates-timeline-view";
import PostUpdateForm from "./post-update-form";

export default function ProjectUpdatesSection({
  initialUpdates,
}: {
  initialUpdates: ProjectUpdate[];
}) {
  const [updates, setUpdates] = React.useState<ProjectUpdate[]>(initialUpdates);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <UpdatesTimelineView updates={updates} />
      <PostUpdateForm onCreate={(u) => setUpdates((prev) => [u, ...prev])} />
    </div>
  );
}
