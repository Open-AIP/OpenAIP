import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AipDetailsTableCard } from "./aip-details-table-card";
import type { AipProjectRow } from "../types";

function makeRow(index: number): AipProjectRow {
  const ref = `1000-${String(index).padStart(3, "0")}`;
  return {
    id: `project-${index}`,
    aipId: "aip-001",
    aipRefCode: ref,
    programProjectDescription: `Project ${index}`,
    implementingAgency: "LGU Office",
    startDate: "2026-01-01",
    completionDate: "2026-12-31",
    expectedOutput: "Output",
    sourceOfFunds: "General Fund",
    personalServices: 1000,
    maintenanceAndOtherOperatingExpenses: 2000,
    financialExpenses: null,
    capitalOutlay: 3000,
    total: 6000,
    climateChangeAdaptation: null,
    climateChangeMitigation: null,
    ccTopologyCode: null,
    prmNcrLguRmObjectiveResultsIndicator: null,
    category: "other",
    errors: null,
    projectRefCode: ref,
    kind: "other",
    sector: "General Sector",
    amount: 6000,
    reviewStatus: "unreviewed",
    aipDescription: `Project ${index}`,
  };
}

describe("AipDetailsTableCard pagination", () => {
  it("paginates rows when enabled", () => {
    const rows = Array.from({ length: 12 }, (_, idx) => makeRow(idx + 1));

    render(
      <AipDetailsTableCard
        year={2026}
        rows={rows}
        onRowClick={vi.fn()}
        enablePagination
      />
    );

    expect(screen.getByText("Showing 1-10 of 12 projects")).toBeInTheDocument();
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.queryByText("Project 11")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Showing 11-12 of 12 projects")).toBeInTheDocument();
    expect(screen.getByText("Project 11")).toBeInTheDocument();
    expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
  });

  it("matches row and legend colors with readable row text across review statuses", () => {
    const rows: AipProjectRow[] = [
      { ...makeRow(1), reviewStatus: "ai_flagged" },
      { ...makeRow(2), reviewStatus: "reviewed" },
      { ...makeRow(3), reviewStatus: "unreviewed" },
    ];

    render(
      <AipDetailsTableCard
        year={2026}
        rows={rows}
        onRowClick={vi.fn()}
      />
    );

    const aiFlaggedProgram = screen.getByText("Project 1");
    const reviewedProgram = screen.getByText("Project 2");
    const unreviewedProgram = screen.getByText("Project 3");
    const aiFlaggedRow = aiFlaggedProgram.closest("tr");
    const reviewedRow = reviewedProgram.closest("tr");
    const unreviewedRow = unreviewedProgram.closest("tr");

    expect(aiFlaggedRow).toHaveClass("bg-red-500");
    expect(reviewedRow).toHaveClass("bg-amber-500");
    expect(unreviewedRow).toHaveClass("bg-slate-300");

    expect(aiFlaggedProgram).toHaveClass("text-slate-900");
    expect(reviewedProgram).toHaveClass("text-slate-900");
    expect(unreviewedProgram).toHaveClass("text-slate-900");

    expect(screen.getByTestId("aip-project-status-legend-ai-flagged")).toHaveClass("bg-red-500");
    expect(screen.getByTestId("aip-project-status-legend-reviewed")).toHaveClass("bg-amber-500");
    expect(screen.getByTestId("aip-project-status-legend-unreviewed")).toHaveClass("bg-slate-300");
  });
});
