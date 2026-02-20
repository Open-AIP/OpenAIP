import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CitySubmissionReviewDetail from "./city-submission-review-detail";
import type { AipHeader } from "@/features/aip/types";
import type { LatestReview } from "@/lib/repos/submissions/repo";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/layout/breadcrumb-nav", () => ({
  BreadcrumbNav: () => <div data-testid="breadcrumb-nav" />,
}));

vi.mock("@/features/aip/components/aip-pdf-container", () => ({
  AipPdfContainer: () => <div data-testid="aip-pdf-container" />,
}));

vi.mock("@/features/aip/components/aip-details-summary", () => ({
  AipDetailsSummary: () => <div data-testid="aip-details-summary" />,
}));

vi.mock("@/features/aip/components/aip-uploader-info", () => ({
  AipUploaderInfo: () => <div data-testid="aip-uploader-info" />,
}));

vi.mock("@/features/aip/views/aip-details-table", () => ({
  AipDetailsTableView: () => <div data-testid="aip-details-table-view" />,
}));

vi.mock("../components/PublishSuccessCard", () => ({
  PublishSuccessCard: () => <div data-testid="publish-success-card" />,
}));

vi.mock("../components/city-revision-feedback-history-card", () => ({
  CityRevisionFeedbackHistoryCard: () => <div data-testid="city-history-card" />,
  toCityRevisionFeedbackCycles: () => [],
}));

vi.mock("../actions/submissionsReview.actions", () => ({
  claimReviewAction: vi.fn(async () => ({ ok: true })),
  publishAipAction: vi.fn(async () => ({ ok: true })),
  requestRevisionAction: vi.fn(async () => ({ ok: true })),
}));

function baseAip(overrides: Partial<AipHeader> = {}): AipHeader {
  return {
    id: "aip-001",
    scope: "barangay",
    barangayName: "Brgy. Test",
    title: "Annual Investment Program 2026",
    description: "AIP description",
    year: 2026,
    budget: 1000000,
    uploadedAt: "2026-01-01",
    status: "published",
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

describe("CitySubmissionReviewDetail sidebar behavior", () => {
  it("renders status info card in fallback branch and keeps feedback history", () => {
    render(
      <CitySubmissionReviewDetail
        aip={baseAip({ status: "published" })}
        latestReview={null}
        actorUserId="city-user-001"
        actorRole="city_official"
      />
    );

    expect(screen.getByText("Published Status")).toBeInTheDocument();
    expect(screen.getByTestId("city-history-card")).toBeInTheDocument();
  });

  it("keeps review actions branch when reviewer owns under_review item", () => {
    const latestReview: LatestReview = {
      reviewerId: "city-user-001",
      reviewerName: "City Reviewer",
      action: "claim_review",
      note: null,
      createdAt: "2026-01-01T08:00:00.000Z",
    };

    render(
      <CitySubmissionReviewDetail
        aip={baseAip({ status: "under_review" })}
        latestReview={latestReview}
        actorUserId="city-user-001"
        actorRole="city_official"
        mode="review"
      />
    );

    expect(screen.getByText("Review Actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish AIP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Revision" })).toBeInTheDocument();
    expect(screen.getByTestId("city-history-card")).toBeInTheDocument();
  });

  it("keeps review assignment branch for pending_review", () => {
    render(
      <CitySubmissionReviewDetail
        aip={baseAip({ status: "pending_review" })}
        latestReview={null}
        actorUserId="city-user-001"
        actorRole="city_official"
      />
    );

    expect(screen.getByText("Review Assignment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review & Claim AIP" })).toBeInTheDocument();
    expect(screen.getByTestId("city-history-card")).toBeInTheDocument();
  });
});
