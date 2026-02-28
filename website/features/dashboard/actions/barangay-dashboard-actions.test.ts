import { beforeEach, describe, expect, it, vi } from "vitest";
import { DASHBOARD_REPLY_MAX_LENGTH } from "@/lib/repos/dashboard/repo";

const mockRevalidatePath = vi.fn();
const mockGetUser = vi.fn();
const mockGetDashboardRepo = vi.fn();
const mockWriteWorkflowActivityLog = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

vi.mock("@/lib/actions/auth.actions", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/repos/dashboard/repo.server", () => ({
  getDashboardRepo: () => mockGetDashboardRepo(),
}));

vi.mock("@/lib/audit/activity-log", () => ({
  writeWorkflowActivityLog: (input: unknown) => mockWriteWorkflowActivityLog(input),
}));

import {
  createBarangayDraftAipAction,
  replyBarangayFeedbackAction,
} from "./barangay-dashboard-actions";

const mockDashboardRepo = {
  createDraftAip: vi.fn(),
  replyToFeedback: vi.fn(),
};

function makeFormData(values: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("barangay-dashboard-actions", () => {
  beforeEach(() => {
    mockRevalidatePath.mockReset();
    mockGetUser.mockReset();
    mockGetDashboardRepo.mockReset();
    mockWriteWorkflowActivityLog.mockReset();
    mockDashboardRepo.createDraftAip.mockReset();
    mockDashboardRepo.replyToFeedback.mockReset();

    mockGetDashboardRepo.mockReturnValue(mockDashboardRepo);
    mockGetUser.mockResolvedValue({
      role: "barangay_official",
      barangayId: "barangay-1",
      userId: "user-1",
    });
    mockDashboardRepo.createDraftAip.mockResolvedValue({
      created: false,
      aipId: "aip-2026",
    });
    mockDashboardRepo.replyToFeedback.mockResolvedValue({
      replyId: "reply-1",
    });
    mockWriteWorkflowActivityLog.mockResolvedValue("log-1");
  });

  it("rejects create-draft with invalid fiscal year before auth/repo", async () => {
    await expect(
      createBarangayDraftAipAction(makeFormData({ fiscalYear: "not-a-number" }))
    ).rejects.toThrow("Invalid fiscal year.");

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockDashboardRepo.createDraftAip).not.toHaveBeenCalled();
  });

  it("rejects create-draft when actor is not barangay_official", async () => {
    mockGetUser.mockResolvedValue({
      role: "city_official",
      barangayId: null,
      userId: "city-user-1",
    });

    await expect(
      createBarangayDraftAipAction(makeFormData({ fiscalYear: "2026" }))
    ).rejects.toThrow("Unauthorized.");

    expect(mockDashboardRepo.createDraftAip).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("keeps create-draft idempotent and skips workflow audit log when already exists", async () => {
    mockDashboardRepo.createDraftAip.mockResolvedValue({
      created: false,
      aipId: "aip-existing",
    });

    await createBarangayDraftAipAction(makeFormData({ fiscalYear: "2026" }));

    expect(mockDashboardRepo.createDraftAip).toHaveBeenCalledWith({
      scope: "barangay",
      scopeId: "barangay-1",
      fiscalYear: 2026,
      createdBy: "user-1",
    });
    expect(mockWriteWorkflowActivityLog).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(1, "/barangay");
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(2, "/barangay/aips");
  });

  it("logs draft_created workflow activity when draft is newly created", async () => {
    mockDashboardRepo.createDraftAip.mockResolvedValue({
      created: true,
      aipId: "aip-created",
    });

    await createBarangayDraftAipAction(makeFormData({ fiscalYear: "2026" }));

    expect(mockWriteWorkflowActivityLog).toHaveBeenCalledTimes(1);
    expect(mockWriteWorkflowActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "draft_created",
        entityTable: "aips",
        entityId: "aip-created",
        scope: { barangayId: "barangay-1" },
        hideCrudAction: "aip_created",
      })
    );
    const logPayload = mockWriteWorkflowActivityLog.mock.calls[0]?.[0] as {
      metadata?: { details?: string; fiscal_year?: number; aip_status?: string };
    };
    expect(logPayload.metadata?.fiscal_year).toBe(2026);
    expect(logPayload.metadata?.aip_status).toBe("draft");
    expect(logPayload.metadata?.details).toContain("fiscal year 2026");
  });

  it("rejects feedback reply with empty body before auth/repo", async () => {
    await expect(
      replyBarangayFeedbackAction(
        makeFormData({
          parentFeedbackId: "fb-root-1",
          body: "   ",
        })
      )
    ).rejects.toThrow("Reply body is required.");

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockDashboardRepo.replyToFeedback).not.toHaveBeenCalled();
  });

  it("rejects feedback reply that exceeds max length before auth/repo", async () => {
    await expect(
      replyBarangayFeedbackAction(
        makeFormData({
          parentFeedbackId: "fb-root-1",
          body: "x".repeat(DASHBOARD_REPLY_MAX_LENGTH + 1),
        })
      )
    ).rejects.toThrow(`Reply body must be at most ${DASHBOARD_REPLY_MAX_LENGTH} characters.`);

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockDashboardRepo.replyToFeedback).not.toHaveBeenCalled();
  });

  it("rejects feedback reply when actor is not barangay_official", async () => {
    mockGetUser.mockResolvedValue({
      role: "citizen",
      barangayId: "barangay-1",
      userId: "citizen-1",
    });

    await expect(
      replyBarangayFeedbackAction(
        makeFormData({
          parentFeedbackId: "fb-root-1",
          body: "Please share update.",
        })
      )
    ).rejects.toThrow("Unauthorized.");

    expect(mockDashboardRepo.replyToFeedback).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("creates lgu_note reply through repo and revalidates dashboard pages", async () => {
    await replyBarangayFeedbackAction(
      makeFormData({
        parentFeedbackId: "fb-root-1",
        body: "  Thanks for your feedback.  ",
      })
    );

    expect(mockDashboardRepo.replyToFeedback).toHaveBeenCalledWith({
      scope: "barangay",
      scopeId: "barangay-1",
      parentFeedbackId: "fb-root-1",
      body: "Thanks for your feedback.",
      authorId: "user-1",
    });
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(1, "/barangay");
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(2, "/barangay/feedback");
  });

  it("propagates citizen-root reply constraint errors from repo", async () => {
    mockDashboardRepo.replyToFeedback.mockRejectedValue(
      new Error("Replies are only allowed for citizen feedback kinds.")
    );

    await expect(
      replyBarangayFeedbackAction(
        makeFormData({
          parentFeedbackId: "fb-reply-1",
          body: "Will respond soon.",
        })
      )
    ).rejects.toThrow("Replies are only allowed for citizen feedback kinds.");

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
