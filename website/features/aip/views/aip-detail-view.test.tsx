import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AipDetailView from "./aip-detail-view";
import type { AipHeader, AipStatus } from "../types";
import type { AipRevisionFeedbackCycle } from "@/lib/repos/aip/repo";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockPush = vi.fn();
let lastDetailsTableProps: {
  scope: "city" | "barangay";
  enablePagination?: boolean;
} | null = null;
let mockProjectsState = {
  loading: false,
  error: null as string | null,
  unresolvedAiCount: 0,
};

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
  AipDetailsTableView: ({
    onProjectsStateChange,
    scope,
    enablePagination,
  }: {
    onProjectsStateChange?: (state: {
      rows: unknown[];
      loading: boolean;
      error: string | null;
      unresolvedAiCount: number;
    }) => void;
    scope: "city" | "barangay";
    enablePagination?: boolean;
  }) => {
    lastDetailsTableProps = { scope, enablePagination };
    React.useEffect(() => {
      onProjectsStateChange?.({
        rows: [],
        loading: mockProjectsState.loading,
        error: mockProjectsState.error,
        unresolvedAiCount: mockProjectsState.unresolvedAiCount,
      });
    }, [onProjectsStateChange]);
    return <div data-testid="aip-details-table-view" />;
  },
}));

vi.mock("@/features/feedback", () => ({
  CommentThreadsSplitView: () => <div data-testid="comment-threads-split-view" />,
}));

vi.mock("../actions/aip-workflow.actions", () => ({
  submitAipForReviewAction: vi.fn(async () => ({ ok: true, message: "Submitted" })),
  submitCityAipForPublishAction: vi.fn(async () => ({ ok: true, message: "Published" })),
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
    lastDetailsTableProps = null;
    mockProjectsState = {
      loading: false,
      error: null,
      unresolvedAiCount: 0,
    };
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
    expect(screen.queryByText("Cycle 1 of 1")).not.toBeInTheDocument();
  });

  it("paginates reviewer feedback history by revision cycle", async () => {
    render(
      <AipDetailView
        aip={baseAip("published", {
          revisionFeedbackCycles: [
            revisionCycle({
              cycleId: "cycle-002",
              reviewerRemark: {
                id: "remark-002",
                body: "Latest reviewer remark.",
                createdAt: "2026-01-03T08:00:00.000Z",
                authorRole: "reviewer",
                authorName: "Latest Reviewer",
              },
              replies: [],
            }),
            revisionCycle({
              cycleId: "cycle-001",
              reviewerRemark: {
                id: "remark-001",
                body: "Older reviewer remark.",
                createdAt: "2026-01-01T08:00:00.000Z",
                authorRole: "reviewer",
                authorName: "Older Reviewer",
              },
              replies: [],
            }),
          ],
        })}
        scope="barangay"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Latest reviewer remark.")).toBeInTheDocument();
    expect(screen.queryByText("Older reviewer remark.")).not.toBeInTheDocument();
    expect(screen.getByText("Cycle 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByText("Latest reviewer remark.")).not.toBeInTheDocument();
    expect(screen.getByText("Older reviewer remark.")).toBeInTheDocument();
    expect(screen.getByText("Cycle 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByText("Latest reviewer remark.")).toBeInTheDocument();
    expect(screen.queryByText("Older reviewer remark.")).not.toBeInTheDocument();
    expect(screen.getByText("Cycle 1 of 2")).toBeInTheDocument();
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

  it("hides reviewer feedback history for published AIP with no feedback cycles", async () => {
    render(
      <AipDetailView
        aip={baseAip("published", {
          revisionFeedbackCycles: [],
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
    expect(screen.getByText("Publication Details")).toBeInTheDocument();
    expect(screen.queryByText("Reviewer Feedback History")).not.toBeInTheDocument();
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

  it("shows city submit and publish CTA for draft", async () => {
    render(<AipDetailView aip={baseAip("draft", { scope: "city" })} scope="city" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Submit & Publish" })).toBeInTheDocument();
    const firstFetchPath = ((global.fetch as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0]?.[0] ?? "") as string;
    expect(firstFetchPath).toContain("/api/city/aips/");
  });

  it("enables project pagination for both barangay and city detail views", async () => {
    const { rerender } = render(<AipDetailView aip={baseAip("draft")} scope="barangay" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });
    expect(lastDetailsTableProps).toEqual({
      scope: "barangay",
      enablePagination: true,
    });

    rerender(<AipDetailView aip={baseAip("draft", { scope: "city" })} scope="city" />);

    await waitFor(() => {
      expect(lastDetailsTableProps).toEqual({
        scope: "city",
        enablePagination: true,
      });
    });
  });

  it("opens draft delete confirmation and deletes barangay draft", async () => {
    const actions = await import("../actions/aip-workflow.actions");
    const deleteDraftAction = vi.mocked(actions.deleteAipDraftAction);

    render(<AipDetailView aip={baseAip("draft")} scope="barangay" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete Draft" }));
    expect(screen.getByText("Delete Draft AIP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }));

    await waitFor(() => {
      expect(deleteDraftAction).toHaveBeenCalledWith({ aipId: "aip-001" });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/barangay/aips");
    });
  });

  it("opens draft delete confirmation and deletes city draft", async () => {
    const actions = await import("../actions/aip-workflow.actions");
    const deleteDraftAction = vi.mocked(actions.deleteAipDraftAction);

    render(<AipDetailView aip={baseAip("draft", { scope: "city" })} scope="city" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete Draft" }));
    expect(screen.getByText("Delete Draft AIP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }));

    await waitFor(() => {
      expect(deleteDraftAction).toHaveBeenCalledWith({ aipId: "aip-001" });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/city/aips");
    });
  });

  it("shows city submit and publish CTA for for_revision", async () => {
    render(
      <AipDetailView
        aip={baseAip("for_revision", { scope: "city" })}
        scope="city"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Submit & Publish" })).toBeInTheDocument();
  });

  it("opens city publish confirmation and submits publish action", async () => {
    const actions = await import("../actions/aip-workflow.actions");
    const publishAction = vi.mocked(actions.submitCityAipForPublishAction);

    render(<AipDetailView aip={baseAip("draft", { scope: "city" })} scope="city" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit & Publish" }));
    expect(screen.getByText("Publish AIP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm & Publish" }));

    await waitFor(() => {
      expect(publishAction).toHaveBeenCalledWith({ aipId: "aip-001" });
    });
  });

  it("shows unresolved AI block message for city submit", async () => {
    mockProjectsState = {
      loading: false,
      error: null,
      unresolvedAiCount: 2,
    };

    render(<AipDetailView aip={baseAip("draft", { scope: "city" })} scope="city" />);

    await waitFor(() => {
      expect(screen.queryByText("Checking extraction status...")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "2 AI-flagged project(s) still need an official response before submission."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit & Publish" })).toBeDisabled();
  });
});
