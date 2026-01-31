import type { CommentSidebarItem, CommentThread } from "../types";

export type CommentTargetProjectSummary = {
  id: string;
  title: string;
  year?: number;
  kind?: "health" | "infrastructure";
};

export type CommentTargetAipSummary = {
  id: string;
  title: string;
  year?: number;
  barangayName?: string | null;
};

export type CommentTargetAipItemSummary = {
  id: string;
  aipId: string;
  projectRefCode?: string;
  aipDescription: string;
};

export type CommentTargetLookup = {
  getProject: (id: string) => Promise<CommentTargetProjectSummary | null>;
  getAip: (id: string) => Promise<CommentTargetAipSummary | null>;
  getAipItem: (
    aipId: string,
    aipItemId: string
  ) => Promise<CommentTargetAipItemSummary | null>;
};

export async function resolveCommentSidebar({
  threads,
  getProject,
  getAip,
  getAipItem,
  scope = "barangay",
}: {
  threads: CommentThread[];
  scope?: "city" | "barangay";
} & CommentTargetLookup): Promise<CommentSidebarItem[]> {
  const items = await Promise.all(
    threads.map(async (thread) => {
      if (thread.target.targetKind === "project") {
        const project = await getProject(thread.target.projectId);
        const contextTitle = project?.title ?? "Project";
        const contextSubtitle = project?.year
          ? `AIP ${project.year}`
          : thread.target.projectId;
        const projectKind = project?.kind ?? "infrastructure";
        const projectPath =
          projectKind === "health" ? "health" : "infrastructure";

        return {
          threadId: thread.id,
          snippet: thread.preview.text,
          updatedAt: thread.preview.updatedAt,
          status: thread.preview.status,
          contextTitle,
          contextSubtitle,
          href: `/${scope}/projects/${projectPath}/${thread.target.projectId}?tab=comments&thread=${thread.id}`,
        } satisfies CommentSidebarItem;
      }

      const aip = await getAip(thread.target.aipId);
      const aipItem = await getAipItem(
        thread.target.aipId,
        thread.target.aipItemId
      );

      const contextTitle = aip?.title ?? "AIP Detail";
      const contextSubtitleParts = [
        aip?.barangayName,
        aipItem?.projectRefCode,
        aipItem?.aipDescription,
      ].filter(Boolean) as string[];
      const contextSubtitle =
        contextSubtitleParts.length > 0
          ? contextSubtitleParts.join(" • ")
          : `${thread.target.aipId} / ${thread.target.aipItemId}`;

      return {
        threadId: thread.id,
        snippet: thread.preview.text,
        updatedAt: thread.preview.updatedAt,
        status: thread.preview.status,
        contextTitle,
        contextSubtitle,
        href: `/${scope}/aips/${thread.target.aipId}?focus=${thread.target.aipItemId}&tab=comments&thread=${thread.id}`,
      } satisfies CommentSidebarItem;
    })
  );

  return items.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
