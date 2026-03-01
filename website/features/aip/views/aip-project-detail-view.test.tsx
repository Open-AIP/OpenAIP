import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AipHeader, AipProjectReviewDetail } from "@/lib/repos/aip/repo";
import AipProjectDetailView from "./aip-project-detail-view";

const mockRefresh = vi.fn();
const mockSearchParams = new URLSearchParams("thread=thread-citizen");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("../actions/aip-projects.actions", () => ({
  submitAipProjectReviewAction: vi.fn(async () => ({})),
}));

vi.mock("@/components/layout/breadcrumb-nav", () => ({
  BreadcrumbNav: () => <div data-testid="breadcrumb-nav" />,
}));

vi.mock("@/features/projects/shared/feedback", () => ({
  LguProjectFeedbackThread: () => <div data-testid="lgu-project-feedback-thread" />,
}));

function buildAip(status: AipHeader["status"]): AipHeader {
  return {
    id: "aip-1",
    scope: "barangay",
    barangayName: "Brgy. Sample",
    title: "AIP 2026",
    description: "AIP",
    year: 2026,
    budget: 100000,
    uploadedAt: "2026-01-01",
    status,
    fileName: "aip.pdf",
    pdfUrl: "https://example.com/aip.pdf",
    sectors: ["General Sector"],
    uploader: {
      name: "Official",
      role: "Barangay Official",
      uploadDate: "2026-01-01",
      budgetAllocated: 100000,
    },
  };
}

function buildDetail(): AipProjectReviewDetail {
  return {
    project: {
      id: "project-1",
      aipId: "aip-1",
      aipRefCode: "1000-001-000-001",
      programProjectDescription: "Road repair",
      implementingAgency: "Barangay",
      startDate: null,
      completionDate: null,
      expectedOutput: null,
      sourceOfFunds: null,
      personalServices: 0,
      maintenanceAndOtherOperatingExpenses: 0,
      financialExpenses: 0,
      capitalOutlay: 0,
      total: 10000,
      climateChangeAdaptation: null,
      climateChangeMitigation: null,
      ccTopologyCode: null,
      prmNcrLguRmObjectiveResultsIndicator: null,
      category: "other",
      errors: null,
      projectRefCode: "1000-001-000-001",
      kind: "other",
      sector: "General Sector",
      amount: 10000,
      reviewStatus: "reviewed",
      aipDescription: "Road repair",
      aiIssues: [],
    },
    feedbackThreads: [
      {
        root: {
          id: "thread-workflow-root",
          parentFeedbackId: null,
          kind: "lgu_note",
          source: "human",
          body: "Workflow remark",
          authorId: "official-1",
          authorName: "Official",
          authorRole: "barangay_official",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        replies: [],
      },
    ],
  };
}

describe("AipProjectDetailView feedback containers", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
  });

  it("shows official comment panel and hides citizen container before publish", () => {
    render(
      <AipProjectDetailView scope="barangay" aip={buildAip("draft")} detail={buildDetail()} />
    );

    expect(screen.getByText("Official Comment / Justification")).toBeInTheDocument();
    expect(screen.getByText("Workflow Feedback")).toBeInTheDocument();
    expect(screen.queryByText("Citizen Feedback")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lgu-project-feedback-thread")).not.toBeInTheDocument();
  });

  it("hides official comment panel and shows citizen container after publish", () => {
    render(
      <AipProjectDetailView
        scope="barangay"
        aip={buildAip("published")}
        detail={buildDetail()}
      />
    );

    expect(screen.queryByText("Official Comment / Justification")).not.toBeInTheDocument();
    expect(screen.getByText("Workflow Feedback")).toBeInTheDocument();
    expect(screen.getByText("Citizen Feedback")).toBeInTheDocument();
    expect(screen.getByTestId("lgu-project-feedback-thread")).toBeInTheDocument();
  });
});
