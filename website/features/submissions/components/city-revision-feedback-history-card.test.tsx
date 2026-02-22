import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AipRevisionFeedbackCycle } from "@/lib/repos/aip/repo";
import {
  CityRevisionFeedbackHistoryCard,
  MISSING_REVIEWER_REMARK_FALLBACK,
  toCityRevisionFeedbackCycles,
} from "./city-revision-feedback-history-card";

function buildCycle(partial: Partial<AipRevisionFeedbackCycle> = {}): AipRevisionFeedbackCycle {
  return {
    cycleId: partial.cycleId ?? "cycle-001",
    reviewerRemark: partial.reviewerRemark ?? {
      id: "remark-001",
      body: "Please provide a clearer budget breakdown.",
      createdAt: "2026-02-01T04:05:00.000Z",
      authorName: "Reviewer One",
      authorRole: "reviewer",
    },
    replies: partial.replies ?? [
      {
        id: "reply-001",
        body: "We added a detailed line-item breakdown.",
        createdAt: "2026-02-02T06:10:00.000Z",
        authorName: "Official One",
        authorRole: "barangay_official",
      },
    ],
  };
}

describe("CityRevisionFeedbackHistoryCard", () => {
  it("renders feedback history with reviewer and reply details", () => {
    render(<CityRevisionFeedbackHistoryCard cycles={[buildCycle()]} />);

    expect(screen.getByText("Revision Feedback History")).toBeInTheDocument();
    expect(
      screen.getByText(
        "City reviewer remarks and barangay replies grouped by revision cycle."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Please provide a clearer budget breakdown.")).toBeInTheDocument();
    expect(screen.getByText("We added a detailed line-item breakdown.")).toBeInTheDocument();
    expect(screen.getByText("Reviewer One")).toBeInTheDocument();
    expect(screen.getByText("Official One")).toBeInTheDocument();
    expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Cycle 1 of 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("paginates by revision cycle with one cycle per page", () => {
    render(
      <CityRevisionFeedbackHistoryCard
        cycles={[
          buildCycle({
            cycleId: "cycle-002",
            reviewerRemark: {
              id: "remark-002",
              body: "Latest reviewer remark.",
              createdAt: "2026-02-06T01:00:00.000Z",
              authorName: "Latest Reviewer",
              authorRole: "reviewer",
            },
            replies: [],
          }),
          buildCycle({
            cycleId: "cycle-001",
            reviewerRemark: {
              id: "remark-001",
              body: "Older reviewer remark.",
              createdAt: "2026-02-01T01:00:00.000Z",
              authorName: "Older Reviewer",
              authorRole: "reviewer",
            },
            replies: [],
          }),
        ]}
      />
    );

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

  it("renders per-cycle empty reply state", () => {
    render(
      <CityRevisionFeedbackHistoryCard
        cycles={[
          buildCycle({
            replies: [],
          }),
        ]}
      />
    );

    expect(
      screen.getByText("No barangay reply saved for this cycle yet.")
    ).toBeInTheDocument();
  });

  it("renders global empty state when no cycles exist", () => {
    render(<CityRevisionFeedbackHistoryCard cycles={[]} />);
    expect(screen.getByText("No revision feedback history yet.")).toBeInTheDocument();
  });

  it("uses City Reviewer fallback when reviewer name is missing", () => {
    render(
      <CityRevisionFeedbackHistoryCard
        cycles={[
          buildCycle({
            reviewerRemark: {
              id: "remark-002",
              body: "Reviewer note without author name.",
              createdAt: "2026-02-03T01:00:00.000Z",
              authorRole: "reviewer",
            },
          }),
        ]}
      />
    );

    expect(screen.getByText("City Reviewer")).toBeInTheDocument();
  });

  it("synthesizes legacy fallback cycle when revisionReply exists but cycles are missing", () => {
    const fallbackCycles = toCityRevisionFeedbackCycles({
      revisionReply: {
        body: "Legacy barangay reply body.",
        createdAt: "2026-02-04T03:20:00.000Z",
      },
      feedback: undefined,
    });

    expect(fallbackCycles).toHaveLength(1);
    expect(fallbackCycles[0]?.reviewerRemark.body).toBe(MISSING_REVIEWER_REMARK_FALLBACK);
    expect(fallbackCycles[0]?.replies[0]?.body).toBe("Legacy barangay reply body.");
  });
});
