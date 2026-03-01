import { describe, expect, it } from "vitest";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import type { CommentThread } from "@/lib/repos/feedback/types";

const basePreview = {
  text: "Sample feedback",
  updatedAt: "2026-02-28T10:00:00.000Z",
  status: "no_response" as const,
  kind: "question" as const,
  authorName: "Citizen",
  authorScopeLabel: "Brgy. Sample",
};

describe("resolveCommentSidebar project tab links", () => {
  it("uses tab=feedback for project thread links", async () => {
    const threads: CommentThread[] = [
      {
        id: "thread-project",
        createdAt: "2026-02-28T09:00:00.000Z",
        createdByUserId: "citizen-1",
        target: { targetKind: "project", projectId: "PROJ-001" },
        preview: basePreview,
      },
    ];

    const items = await resolveCommentSidebar({
      threads,
      scope: "barangay",
      getProject: async () => ({
        id: "PROJ-001",
        title: "Project One",
        year: 2026,
        kind: "health",
      }),
      getAip: async () => null,
      getAipItem: async () => null,
      findAipItemByProjectRefCode: async () => null,
    });

    expect(items[0]?.href).toContain(
      "/barangay/projects/health/PROJ-001?tab=feedback&thread=thread-project"
    );
  });

  it("keeps tab=comments for AIP thread links", async () => {
    const threads: CommentThread[] = [
      {
        id: "thread-aip",
        createdAt: "2026-02-28T09:00:00.000Z",
        createdByUserId: "citizen-1",
        target: { targetKind: "aip_item", aipId: "aip-1", aipItemId: "item-1" },
        preview: basePreview,
      },
    ];

    const items = await resolveCommentSidebar({
      threads,
      scope: "city",
      getProject: async () => null,
      getAip: async () => ({
        id: "aip-1",
        title: "AIP 2026",
        year: 2026,
        barangayName: "Brgy. Sample",
      }),
      getAipItem: async () => ({
        id: "item-1",
        aipId: "aip-1",
        projectRefCode: "PROJ-001",
        aipDescription: "AIP Item",
      }),
      findAipItemByProjectRefCode: async () => null,
    });

    expect(items[0]?.href).toContain(
      "/city/aips/aip-1?focus=item-1&tab=comments&thread=thread-aip"
    );
  });
});
