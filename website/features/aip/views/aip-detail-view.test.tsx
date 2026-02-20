import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AipDetailView from "./aip-detail-view";
import type { AipHeader, AipStatus } from "../types";
import type { AipRevisionFeedbackCycle } from "@/lib/repos/aip/repo";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/barangay/aips/aip-001",
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/layout/breadcrumb-nav", () => ({
  BreadcrumbNav: () => <div data-testid="breadcrumb-nav" />,
}));

vi.mock("../components/aip-pdf-container", () => ({
  AipPdfContainer: () => <div data-testid="aip-pdf-container" />,
}));

vi.mock("../components/aip-details-summary", () => ({
  AipDetailsSummary: () => <div data-testid="aip-details-summary" />,
}));

vi.mock("../components/aip-uploader-info", () => ({
  AipUploaderInfo: () => <div data-testid="aip-uploader-info" />,
}));

vi.mock("../components/aip-processing-inline-status", () => ({
  AipProcessingInlineStatus: () => <div data-testid="aip-processing-inline-status" />,
}));

vi.mock("./aip-details-table", () => ({
  AipDetailsTableView: () => <div data-testid="aip-details-table-view" />,
}));

vi.mock("@/features/feedback", () => ({
  CommentThreadsSplitView: () => <div data-testid="comment-threads-split-view" />,
}));

vi.mock("../actions/aip-workflow.actions", () => ({
  submitAipForReviewAction: vi.fn(async () => ({ ok: true, message: "Submitted" })),
  saveAipRevisionReplyAction: vi.fn(async () => ({ ok: true, message: "Saved" })),
  deleteAipDraftAction: vi.fn(async () => ({ ok: true, message: "Deleted" })),
  cancelAipSubmissionAction: vi.fn(async () => ({ ok: true, message: "Canceled" })),
}));

function baseAip(status: AipStatus, overrides: Partial<AipHeader> = {}): AipHeader {
  return {
    id: "aip-001",
    scope: "barangay",
    barangayName: "Brgy. Test",
    title: "Annual Investment Program 2026",
    description: "AIP description",
    year: 2026,
    budget: 1000000,
    uploadedAt: "2026-01-01",
    status,
    fileName: "AIP_2026_Test.pdf",
    pdfUrl: "https://example.com/aip.pdf",
    sectors: ["General Sector"],
    uploader: {
      name: "Test User",
      role: "Barangay Official",
      uploadDate: "Jan 1, 2026",
      budgetAllocated: 1000000,
    },
    ...overrides,
  };
}

function revisionCycle(overrides: Partial<AipRevisionFeedbackCycle> = {}): AipRevisionFeedbackCycle {
  return {
    cycleId: "cycle-001",
    reviewerRemark: {
      id: "remark-001",
      body: "Please revise.",
      createdAt: "2026-01-01T08:00:00.000Z",
      authorRole: "reviewer",
      authorName: "Reviewer",
    },
    replies: [],
    ...overrides,
  };
}

describe("AipDetailView sidebar behavior", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ run: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows actionable sidebar for for_revision", async () => {
    render(
      <AipDetailView
        aip={baseAip("for_revision", {
          feedback: "Reviewer feedback is available.",
          revisionFeedbackCycles: [revisionCycle()],
        })}
        scope="barangay"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Official Comment / Justification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resubmit" })).toBeInTheDocument();
    expect(screen.getByText("Reviewer Feedback History")).toBeInTheDocument();
  });

  it("shows cancel action sidebar for pending_review", async () => {
    render(
      <AipDetailView
        aip={baseAip("pending_review", {
          revisionFeedbackCycles: [revisionCycle()],
        })}
        scope="barangay"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Official Comment / Justification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Submission" })).toBeInTheDocument();
    expect(screen.getByText("Reviewer Feedback History")).toBeInTheDocument();
  });

  it("shows status info sidebar for under_review with no workflow actions", async () => {
    render(
      <AipDetailView
        aip={baseAip("under_review", {
          revisionFeedbackCycles: [revisionCycle()],
        })}
        scope="barangay"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Under Review Status")).toBeInTheDocument();
    expect(screen.queryByText("Official Comment / Justification")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resubmit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Submission" })).not.toBeInTheDocument();
    expect(screen.queryByText("Publication Details")).not.toBeInTheDocument();
    expect(screen.getByText("Reviewer Feedback History")).toBeInTheDocument();
  });

  it("shows status info sidebar for published with no workflow actions", async () => {
    render(
      <AipDetailView
        aip={baseAip("published", {
          revisionFeedbackCycles: [revisionCycle()],
          publishedBy: {
            reviewerId: "city-user-001",
            reviewerName: "City Reviewer",
            createdAt: "2026-01-02T08:30:00.000Z",
          },
        })}
        scope="barangay"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Published Status")).toBeInTheDocument();
    expect(screen.queryByText("Official Comment / Justification")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resubmit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Submission" })).not.toBeInTheDocument();
    expect(screen.getByText("Publication Details")).toBeInTheDocument();
    expect(screen.getByText(/City Reviewer/)).toBeInTheDocument();
    expect(screen.getByText("Reviewer Feedback History")).toBeInTheDocument();
  });

  it("shows actionable sidebar for draft with revision history", async () => {
    render(
      <AipDetailView
        aip={baseAip("draft", {
          revisionFeedbackCycles: [revisionCycle()],
        })}
        scope="barangay"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Official Comment / Justification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Reply" })).toBeInTheDocument();
    expect(screen.getByText("Reviewer Feedback History")).toBeInTheDocument();
  });

  it("hides right sidebar for draft without revision history", async () => {
    render(<AipDetailView aip={baseAip("draft")} scope="barangay" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Official Comment / Justification")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer Feedback History")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft Status")).not.toBeInTheDocument();
  });
});
