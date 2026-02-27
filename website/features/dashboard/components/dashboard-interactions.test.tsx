import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { DashboardHeader } from "./dashboard-header-widgets";
import { TopProjectsFilters } from "./dashboard-projects-overview";
import { BudgetBreakdownSection } from "./dashboard-budget-allocation";
import { AipsByYearTable } from "./dashboard-aip-publication-status";
import { RecentActivityFeed } from "./dashboard-activity-updates";
import type { DashboardQueryState } from "@/features/dashboard/types/dashboard-types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string | URL;
    children: ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : String(href)} {...props}>
      {children}
    </a>
  ),
}));

const requestSubmitMock = vi.fn();

beforeAll(() => {
  Object.defineProperty(HTMLFormElement.prototype, "requestSubmit", {
    configurable: true,
    writable: true,
    value: requestSubmitMock,
  });
});

beforeEach(() => {
  requestSubmitMock.mockReset();
});

afterAll(() => {
  vi.restoreAllMocks();
});

const queryState: DashboardQueryState = {
  q: "drainage",
  tableQ: "center",
  tableCategory: "health",
  tableSector: "3000",
  kpiMode: "summary",
};

describe("DashboardHeader interactions", () => {
  it("auto-submits when fiscal year changes and preserves table filters", () => {
    render(
      <DashboardHeader
        title="Welcome to OpenAIP"
        q={queryState.q}
        tableQ={queryState.tableQ}
        tableCategory={queryState.tableCategory}
        tableSector={queryState.tableSector}
        selectedFiscalYear={2026}
        availableFiscalYears={[2026, 2025]}
        kpiMode={queryState.kpiMode}
      />
    );

    fireEvent.change(screen.getByLabelText("Select Year"), {
      target: { value: "2025" },
    });

    expect(requestSubmitMock).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue(queryState.tableQ)).toHaveAttribute("name", "tableQ");
    expect(screen.getByDisplayValue(queryState.tableCategory)).toHaveAttribute("name", "category");
    expect(screen.getByDisplayValue(queryState.tableSector)).toHaveAttribute("name", "sector");
  });

  it("submits global search on Enter and blur", () => {
    render(
      <DashboardHeader
        title="Welcome to OpenAIP"
        q={queryState.q}
        selectedFiscalYear={2026}
        availableFiscalYears={[2026]}
      />
    );

    const searchInput = screen.getByLabelText("Global search");
    fireEvent.keyDown(searchInput, { key: "Enter" });
    fireEvent.change(searchInput, { target: { value: "new query" } });
    fireEvent.blur(searchInput);

    expect(requestSubmitMock).toHaveBeenCalledTimes(2);
  });
});

describe("Top funded filters interactions", () => {
  it("auto-submits on category/type changes and search blur/enter", () => {
    render(
      <TopProjectsFilters
        queryState={queryState}
        selectedFiscalYear={2026}
        sectors={[
          { code: "3000", label: "Social Services" },
          { code: "8000", label: "Economic Services" },
        ]}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Health"), {
      target: { value: "infrastructure" },
    });
    fireEvent.change(screen.getByDisplayValue("Social Services"), {
      target: { value: "8000" },
    });

    const input = screen.getByPlaceholderText("Search projects...");
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "road" } });
    fireEvent.blur(input);

    expect(requestSubmitMock).toHaveBeenCalledTimes(4);
  });
});

describe("Dashboard links and actions", () => {
  it("keeps only View AIP Details in budget breakdown", () => {
    render(
      <BudgetBreakdownSection
        totalBudget="PHP 1,000,000"
        detailsHref="/barangay/aips/aip-1"
        items={[
          {
            sectorCode: "3000",
            label: "Social Services",
            amount: 1000000,
            percentage: 100,
          },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "View AIP Details" })).toHaveAttribute(
      "href",
      "/barangay/aips/aip-1"
    );
    expect(screen.queryByRole("link", { name: "View All Projects" })).toBeNull();
  });

  it("routes AIPs-by-year row View action to scope-specific AIP details", () => {
    render(
      <AipsByYearTable
        rows={[
          {
            id: "aip-2026",
            fiscalYear: 2026,
            status: "draft",
            statusUpdatedAt: "2026-02-27T08:00:00.000Z",
            submittedAt: null,
            publishedAt: null,
            createdAt: "2026-02-27T08:00:00.000Z",
            uploadedBy: "Officer",
            uploadedDate: "2026-02-27T08:00:00.000Z",
          },
        ]}
        basePath="/barangay"
      />
    );

    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/barangay/aips/aip-2026"
    );
  });

  it("routes recent activity audit CTA to provided audit page", () => {
    render(
      <RecentActivityFeed
        runs={[
          {
            id: "run-1",
            aipId: "aip-1",
            stage: "extract",
            status: "succeeded",
            startedAt: "2026-02-27T08:00:00.000Z",
            finishedAt: "2026-02-27T08:10:00.000Z",
            errorCode: null,
            errorMessage: null,
            createdAt: "2026-02-27T08:00:00.000Z",
          },
        ]}
        auditHref="/barangay/audit"
      />
    );

    expect(screen.getByRole("link", { name: "View Audit and Accountability" })).toHaveAttribute(
      "href",
      "/barangay/audit"
    );
  });
});
