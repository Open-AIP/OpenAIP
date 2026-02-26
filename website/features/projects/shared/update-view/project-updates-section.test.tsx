import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import ProjectUpdatesSection from "./project-updates-section";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

const INITIAL_UPDATES = [
  {
    id: "u1",
    title: "Milestone reached",
    date: "2026-01-01",
    description: "Work package completed",
    progressPercent: 40,
  },
];

describe("ProjectUpdatesSection", () => {
  it("shows timeline and post form when posting is allowed", () => {
    render(<ProjectUpdatesSection initialUpdates={INITIAL_UPDATES} allowPosting />);

    expect(screen.getByText("Updates Timeline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post Update" })).toBeInTheDocument();
  });

  it("shows timeline only when posting is disabled", () => {
    render(<ProjectUpdatesSection initialUpdates={INITIAL_UPDATES} allowPosting={false} />);

    expect(screen.getByText("Updates Timeline")).toBeInTheDocument();
    expect(screen.queryByText("Post Update")).not.toBeInTheDocument();
  });
});
