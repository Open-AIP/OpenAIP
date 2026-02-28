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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const INITIAL_UPDATES = [
  {
    id: "u1",
    title: "Milestone reached",
    date: "2026-01-01",
    description: "Work package completed",
    progressPercent: 40,
    attendanceCount: 25,
  },
  {
    id: "u2",
    title: "Second milestone",
    date: "2026-01-15",
    description: "Another work package completed",
    progressPercent: 65,
    attendanceCount: 15,
  },
];

describe("ProjectUpdatesSection", () => {
  it("shows timeline and post form when posting is allowed", () => {
    render(
      <ProjectUpdatesSection
        initialUpdates={INITIAL_UPDATES}
        allowPosting
        projectId="PROJ-2026-001"
        scope="barangay"
        projectKind="health"
        participantsTargetTotal={100}
      />
    );

    expect(screen.getByText("Updates Timeline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post Update" })).toBeInTheDocument();
    expect(
      screen.getByText("Current progress: 65%. New update must be greater than 65%.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Current participants reached:/)).toBeInTheDocument();
    expect(screen.getByText(/40 \/ 100/)).toBeInTheDocument();
  });

  it("shows timeline only when posting is disabled", () => {
    render(<ProjectUpdatesSection initialUpdates={INITIAL_UPDATES} allowPosting={false} />);

    expect(screen.getByText("Updates Timeline")).toBeInTheDocument();
    expect(screen.queryByText("Post Update")).not.toBeInTheDocument();
  });

  it("does not show participants target metric when target is not provided", () => {
    render(
      <ProjectUpdatesSection
        initialUpdates={INITIAL_UPDATES}
        allowPosting
        projectId="PROJ-2026-001"
        scope="barangay"
        projectKind="infrastructure"
      />
    );

    expect(screen.queryByText(/Current participants reached:/)).not.toBeInTheDocument();
    expect(screen.queryByText("Attendance Count *")).not.toBeInTheDocument();
  });
});
