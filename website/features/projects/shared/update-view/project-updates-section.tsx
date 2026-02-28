/**
 * Project Updates Section Component
 * 
 * Container component that combines the updates timeline and post update form.
 * Manages the state of project updates and provides a consistent layout
 * for displaying and creating updates.
 * 
 * @module feature/projects/shared/update-view/project-updates-section
 */

"use client";

import * as React from "react";
import type { ProjectUpdateUi } from "@/features/projects/types";
import UpdatesTimelineView from "./updates-timeline-view";
import PostUpdateForm from "./post-update-form";

type PostingScope = "barangay" | "city";
type PostingProjectKind = "health" | "infrastructure";

type ProjectUpdatesSectionProps =
  | {
      initialUpdates: ProjectUpdateUi[];
      allowPosting?: false;
      projectId?: never;
      scope?: never;
      projectKind?: never;
      participantsTargetTotal?: never;
    }
  | {
      initialUpdates: ProjectUpdateUi[];
      allowPosting: true;
      projectId: string;
      scope: PostingScope;
      projectKind: PostingProjectKind;
      participantsTargetTotal?: number | null;
    };

/**
 * ProjectUpdatesSection Component
 * 
 * Shared component for project update management.
 * Features:
 * - Displays existing updates in timeline format
 * - Provides form for posting new updates
 * - Manages update state locally
 * - Responsive two-column layout (timeline + form)
 * 
 * New updates are prepended to the list for chronological display.
 * 
 * @param initialUpdates - Initial array of project updates
 */
export default function ProjectUpdatesSection(props: ProjectUpdatesSectionProps) {
  const { initialUpdates } = props;
  const [updates, setUpdates] = React.useState<ProjectUpdateUi[]>(initialUpdates);

  React.useEffect(() => {
    setUpdates(initialUpdates);
  }, [initialUpdates]);

  const currentProgressPercent = React.useMemo(
    () => updates.reduce((maxProgress, update) => Math.max(maxProgress, update.progressPercent), 0),
    [updates]
  );

  const currentParticipantsReached = React.useMemo(
    () =>
      updates.reduce(
        (totalParticipants, update) => totalParticipants + (update.attendanceCount ?? 0),
        0
      ),
    [updates]
  );

  if (props.allowPosting !== true) {
    return <UpdatesTimelineView updates={updates} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <UpdatesTimelineView updates={updates} />
      <PostUpdateForm
        projectId={props.projectId}
        scope={props.scope}
        projectKind={props.projectKind}
        currentProgressPercent={currentProgressPercent}
        currentParticipantsReached={currentParticipantsReached}
        participantsTargetTotal={props.participantsTargetTotal}
        onCreate={(u) => setUpdates((prev) => [u, ...prev])}
      />
    </div>
  );
}
