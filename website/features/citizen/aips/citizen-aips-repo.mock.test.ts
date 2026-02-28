import { describe, expect, it } from "vitest";
import { createMockCitizenAipRepo } from "@/lib/repos/citizen-aips/repo.mock";

describe("CitizenAipRepo mock adapter", () => {
  it("lists only published AIPs", async () => {
    const repo = createMockCitizenAipRepo();
    const rows = await repo.listPublishedAips();

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.publishedAt !== null)).toBe(true);
  });

  it("returns null for unpublished AIP detail", async () => {
    const repo = createMockCitizenAipRepo();
    const detail = await repo.getPublishedAipDetail("aip-2026-santamaria-draft");

    expect(detail).toBeNull();
  });

  it("returns null for project detail not belonging to a published AIP", async () => {
    const repo = createMockCitizenAipRepo();
    const detail = await repo.getPublishedAipProjectDetail({
      aipId: "aip-2026-santamaria-draft",
      projectId: "aip-item-2026-santamaria-001",
    });

    expect(detail).toBeNull();
  });
});
