import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeedbackKpiRow } from "./feedback-kpi-row";

describe("FeedbackKpiRow", () => {
  it("renders all five KPI cards with the provided counts", () => {
    render(
      <FeedbackKpiRow
        counts={{
          total: 8,
          commend: 2,
          suggestion: 3,
          question: 1,
          concern: 2,
        }}
      />
    );

    expect(screen.getByText("Total Comments")).toBeInTheDocument();
    expect(screen.getByText("Commendation")).toBeInTheDocument();
    expect(screen.getByText("Suggestion")).toBeInTheDocument();
    expect(screen.getByText("Question")).toBeInTheDocument();
    expect(screen.getByText("Concern")).toBeInTheDocument();

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("Across selected filters")).toHaveLength(5);
  });
});
