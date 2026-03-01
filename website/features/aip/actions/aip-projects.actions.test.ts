import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AipProjectRow } from "@/lib/repos/aip/repo";

const mockGetActorContext = vi.fn();
const mockGetAipDetail = vi.fn();
const mockSubmitReview = vi.fn();
const mockAssertActorCanManageBarangayAipWorkflow = vi.fn();

vi.mock("@/lib/domain/get-actor-context", () => ({
  getActorContext: () => mockGetActorContext(),
}));

vi.mock("@/lib/repos/aip/repo.server", () => ({
  getAipRepo: vi.fn(() => ({
    getAipDetail: mockGetAipDetail,
  })),
  getAipProjectRepo: vi.fn(() => ({
    listByAip: vi.fn(async () => []),
    submitReview: mockSubmitReview,
  })),
}));

vi.mock("@/lib/repos/aip/workflow-permissions.server", () => ({
  assertActorCanManageBarangayAipWorkflow: (...args: unknown[]) =>
    mockAssertActorCanManageBarangayAipWorkflow(...args),
}));

import { submitAipProjectReviewAction } from "./aip-projects.actions";

function buildProjectRow(): AipProjectRow {
  return {
    id: "project-001",
    aipId: "aip-001",
    aipRefCode: "1000-001",
    programProjectDescription: "Road repair",
    implementingAgency: null,
    startDate: null,
    completionDate: null,
    expectedOutput: null,
    sourceOfFunds: null,
    personalServices: null,
    maintenanceAndOtherOperatingExpenses: null,
    financialExpenses: null,
    capitalOutlay: null,
    total: 1000,
    climateChangeAdaptation: null,
    climateChangeMitigation: null,
    ccTopologyCode: null,
    prmNcrLguRmObjectiveResultsIndicator: null,
    category: "infrastructure",
    errors: null,
    projectRefCode: "1000-001",
    kind: "infrastructure",
    sector: "General Sector",
    amount: 1000,
    reviewStatus: "reviewed",
    aipDescription: "Road repair",
    aiIssues: undefined,
    officialComment: "Updated",
  };
}

describe("submitAipProjectReviewAction uploader ownership", () => {
  beforeEach(() => {
    mockGetActorContext.mockReset();
    mockGetAipDetail.mockReset();
    mockSubmitReview.mockReset();
    mockAssertActorCanManageBarangayAipWorkflow.mockReset();

    mockGetActorContext.mockResolvedValue({
      userId: "barangay-official-001",
      role: "barangay_official",
      scope: { kind: "barangay", id: "barangay-001" },
    });
    mockGetAipDetail.mockResolvedValue({
      id: "aip-001",
      scope: "barangay",
    });
    mockSubmitReview.mockResolvedValue(buildProjectRow());
    mockAssertActorCanManageBarangayAipWorkflow.mockResolvedValue(undefined);
  });

  it("rejects non-uploader barangay official", async () => {
    mockAssertActorCanManageBarangayAipWorkflow.mockRejectedValueOnce(
      new Error("Only the uploader of this AIP can modify this workflow.")
    );

    await expect(
      submitAipProjectReviewAction({
        aipId: "aip-001",
        projectId: "project-001",
        reason: "  Updated figures  ",
      })
    ).rejects.toThrow("Only the uploader of this AIP can modify this workflow.");
  });

  it("allows uploader barangay official", async () => {
    const result = await submitAipProjectReviewAction({
      aipId: "aip-001",
      projectId: "project-001",
      reason: "  Updated figures  ",
    });

    expect(result.id).toBe("project-001");
    expect(mockSubmitReview).toHaveBeenCalledWith(
      expect.objectContaining({
        aipId: "aip-001",
        projectId: "project-001",
        reason: "Updated figures",
      })
    );
  });
});
