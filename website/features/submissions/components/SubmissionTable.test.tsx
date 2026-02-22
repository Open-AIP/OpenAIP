import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubmissionTable } from "./SubmissionTable";
import type { AipSubmissionRow } from "@/lib/repos/submissions/repo";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : String(href)} {...props}>
      {children}
    </a>
  ),
}));

function buildRow(overrides: Partial<AipSubmissionRow> = {}): AipSubmissionRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Annual Investment Program 2026",
    year: 2026,
    status: "pending_review",
    scope: "barangay",
    barangayName: "Brgy. Test",
    uploadedAt: "2026-01-01T08:00:00.000Z",
    reviewerName: null,
    ...overrides,
  };
}

describe("SubmissionTable action links", () => {
  it("routes pending_review rows to canonical review entry params", () => {
    const row = buildRow();
    render(<SubmissionTable aips={[row]} />);

    const reviewLink = screen.getByRole("link", { name: "Review" });
    expect(reviewLink).toHaveAttribute(
      "href",
      `/city/submissions/aip/${row.id}?mode=review&intent=review`
    );
  });

  it("routes under_review rows to continue-review mode", () => {
    const row = buildRow({
      id: "22222222-2222-2222-2222-222222222222",
      status: "under_review",
    });
    render(<SubmissionTable aips={[row]} />);

    const continueLink = screen.getByRole("link", { name: "Continue Review" });
    expect(continueLink).toHaveAttribute(
      "href",
      `/city/submissions/aip/${row.id}?mode=review`
    );
  });

  it("routes non-reviewable rows to detail view mode", () => {
    const row = buildRow({
      id: "33333333-3333-3333-3333-333333333333",
      status: "published",
    });
    render(<SubmissionTable aips={[row]} />);

    const viewLink = screen.getByRole("link", { name: "View" });
    expect(viewLink).toHaveAttribute("href", `/city/submissions/aip/${row.id}`);
  });
});
