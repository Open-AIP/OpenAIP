import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import CitizenAipsListView from "./views/citizen-aips-list-view";
import type { AipListItem } from "./types";

vi.mock("@/features/citizen/components/citizen-page-hero", () => ({
  default: () => <div data-testid="hero" />,
}));

vi.mock("@/features/citizen/components/citizen-explainer-card", () => ({
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="explainer">{children}</div>
  ),
}));

vi.mock("@/features/citizen/aips/components/aip-list-card", () => ({
  default: ({ item }: { item: AipListItem }) => <div>{item.title}</div>,
}));

vi.mock("@/features/citizen/components/citizen-filters-bar", () => ({
  default: ({
    yearOptions,
    lguOptions,
    onYearChange,
    onLguChange,
  }: {
    yearOptions: Array<string | { value: string; label: string }>;
    lguOptions: Array<string | { value: string; label: string }>;
    onYearChange: (value: string) => void;
    onLguChange: (value: string) => void;
  }) => {
    const firstYear =
      typeof yearOptions[0] === "string" ? yearOptions[0] : yearOptions[0]?.value ?? "";
    const secondYear =
      typeof yearOptions[1] === "string" ? yearOptions[1] : yearOptions[1]?.value ?? "";
    const firstLgu =
      typeof lguOptions[0] === "string" ? lguOptions[0] : lguOptions[0]?.value ?? "";
    const secondLgu =
      typeof lguOptions[1] === "string" ? lguOptions[1] : lguOptions[1]?.value ?? "";

    return (
      <div data-testid="filters">
        <button onClick={() => onYearChange(firstYear)}>year-0</button>
        <button onClick={() => onYearChange(secondYear)}>year-1</button>
        <button onClick={() => onLguChange(firstLgu)}>lgu-0</button>
        <button onClick={() => onLguChange(secondLgu)}>lgu-1</button>
      </div>
    );
  },
}));

const ITEMS: AipListItem[] = [
  {
    id: "aip-a-2026",
    scopeType: "city",
    scopeId: "city-a",
    lguLabel: "City A",
    title: "AIP City A 2026",
    fiscalYear: 2026,
    publishedAt: "2026-01-10",
    budgetTotal: 1000000,
    projectsCount: 1,
    description: "City A 2026",
  },
  {
    id: "aip-a-2025",
    scopeType: "city",
    scopeId: "city-a",
    lguLabel: "City A",
    title: "AIP City A 2025",
    fiscalYear: 2025,
    publishedAt: "2025-01-10",
    budgetTotal: 900000,
    projectsCount: 1,
    description: "City A 2025",
  },
  {
    id: "aip-b-2026",
    scopeType: "barangay",
    scopeId: "brgy-b",
    lguLabel: "Brgy. B",
    title: "AIP Brgy B 2026",
    fiscalYear: 2026,
    publishedAt: "2026-01-12",
    budgetTotal: 800000,
    projectsCount: 1,
    description: "Brgy B 2026",
  },
];

describe("CitizenAipsListView", () => {
  it("keeps year/LGU selection coupled to valid published combinations", () => {
    render(<CitizenAipsListView items={ITEMS} />);

    expect(screen.getByText(/Showing 1 result/)).toBeInTheDocument();
    expect(screen.getByText("AIP Brgy B 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByText("lgu-1"));
    expect(screen.getByText("AIP City A 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByText("year-1"));
    expect(screen.getByText("AIP City A 2025")).toBeInTheDocument();
  });
});
