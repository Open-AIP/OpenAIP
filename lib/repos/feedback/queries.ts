import type { CommentSidebarItem, CommentThread } from "./types";
import type { CommentTargetLookup } from "./repo";
import { dedupeByKey, findDuplicateKeys } from "./mappers";
import { feedbackDebugLog } from "./debug";
import type { LguScopeKind } from "@/lib/auth/scope";

export async function resolveCommentSidebar({
  threads,
  getProject,
  getAip,
  getAipItem,
  findAipItemByProjectRefCode,
  scope = "barangay",
}: {
  threads: CommentThread[];
  scope?: LguScopeKind;
} & CommentTargetLookup): Promise<CommentSidebarItem[]> {
  const threadDuplicates = findDuplicateKeys(threads, (thread) => thread.id);
  if (threadDuplicates.length > 0) {
    feedbackDebugLog("resolveCommentSidebar input duplicates", {
      count: threadDuplicates.length,
      ids: threadDuplicates,
    });
  }

  const items = await Promise.all(
    dedupeByKey(threads, (thread) => thread.id).map(async (thread) => {
      if (thread.target.targetKind === "project") {
        const project = await getProject(thread.target.projectId);
        if (!project?.kind) {
          const aipItem = await findAipItemByProjectRefCode?.(thread.target.projectId);

          if (aipItem) {
            const aip = await getAip(aipItem.aipId);

            const contextTitle = aip?.title ?? "AIP Detail";
            const contextSubtitleParts = [
              aip?.barangayName,
              aipItem.projectRefCode,
              aipItem.aipDescription,
            ].filter(Boolean) as string[];
            const contextSubtitle =
              contextSubtitleParts.length > 0
                ? contextSubtitleParts.join(" • ")
                : `${aipItem.aipId} / ${aipItem.id}`;

            return {
              threadId: thread.id,
              snippet: thread.preview.text,
              updatedAt: thread.preview.updatedAt,
              status: thread.preview.status,
              contextTitle,
              contextSubtitle,
              href: `/${scope}/aips/${aipItem.aipId}?focus=${aipItem.id}&tab=comments&thread=${thread.id}`,
            } satisfies CommentSidebarItem;
          }
        }

        const contextTitle = project?.title ?? "Project";
        const contextSubtitle = project?.year ? `AIP ${project.year}` : thread.target.projectId;
        const projectKind = project?.kind ?? "infrastructure";
        const projectPath = projectKind === "health" ? "health" : "infrastructure";

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

      if (thread.target.targetKind === "aip") {
        const aip = await getAip(thread.target.aipId);

        if (thread.target.fieldKey) {
          const aipItem = await getAipItem(thread.target.aipId, thread.target.fieldKey);

          const contextTitle = aip?.title ?? "AIP Detail";
          const contextSubtitleParts = [
            aip?.barangayName,
            aipItem?.projectRefCode,
            aipItem?.aipDescription,
          ].filter(Boolean) as string[];
          const contextSubtitle =
            contextSubtitleParts.length > 0
              ? contextSubtitleParts.join(" • ")
              : `${thread.target.aipId} / ${thread.target.fieldKey}`;

          return {
            threadId: thread.id,
            snippet: thread.preview.text,
            updatedAt: thread.preview.updatedAt,
            status: thread.preview.status,
            contextTitle,
            contextSubtitle,
            href: `/${scope}/aips/${thread.target.aipId}?focus=${thread.target.fieldKey}&tab=comments&thread=${thread.id}`,
          } satisfies CommentSidebarItem;
        }

        const contextTitle = aip?.title ?? "AIP Detail";
        const contextSubtitleParts = [
          aip?.barangayName,
          aip?.year ? `AIP ${aip.year}` : null,
        ].filter(Boolean) as string[];
        const contextSubtitle =
          contextSubtitleParts.length > 0
            ? contextSubtitleParts.join(" | ")
            : thread.target.aipId;

        return {
          threadId: thread.id,
          snippet: thread.preview.text,
          updatedAt: thread.preview.updatedAt,
          status: thread.preview.status,
          contextTitle,
          contextSubtitle,
          href: `/${scope}/aips/${thread.target.aipId}?tab=comments&thread=${thread.id}`,
        } satisfies CommentSidebarItem;
      }

      throw new Error("Unsupported feedback target");
    })
  );

  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

