import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { HealthProject } from "@/features/projects/types";
import HealthProjectCard from "./health-project-card";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill, ...imgProps } = props;
    void fill;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={imgProps.alt ?? ""} {...imgProps} />
    );
  },
}));

function buildProject(overrides: Partial<HealthProject> = {}): HealthProject {
  return {
    id: "PROJ-H-TEST-001",
    kind: "health",
    year: 2026,
    title: "Health Project Test",
    status: "ongoing",
    imageUrl: "/mock/health/health1.jpg",
    month: "January",
    description: "Project description",
    totalTargetParticipants: 100,
    targetParticipants: "Residents",
    implementingOffice: "Barangay Health Office",
    budgetAllocated: 100000,
    updates: [],
    ...overrides,
  };
}

describe("HealthProjectCard image fallback", () => {
  it("uses logo fallback when image is missing and fallback is enabled", () => {
    const project = { ...buildProject(), imageUrl: null } as unknown as HealthProject;
    render(<HealthProjectCard project={project} useLogoFallback />);

    const image = screen.getByRole("img", { name: "Health Project Test" });
    expect(image.getAttribute("src")).toContain("/brand/logo3.svg");
  });

  it("uses logo fallback when image is default placeholder and fallback is enabled", () => {
    render(
      <HealthProjectCard
        project={buildProject({ imageUrl: "/default/default-no-image.jpg" })}
        useLogoFallback
      />
    );

    const image = screen.getByRole("img", { name: "Health Project Test" });
    expect(image.getAttribute("src")).toContain("/brand/logo3.svg");
  });

  it("switches to logo on image load error when fallback is enabled", async () => {
    render(
      <HealthProjectCard
        project={buildProject({ imageUrl: "/broken/custom-image.jpg" })}
        useLogoFallback
      />
    );

    const image = screen.getByRole("img", { name: "Health Project Test" });
    expect(image.getAttribute("src")).toContain("/broken/custom-image.jpg");

    fireEvent.error(image);

    await waitFor(() => {
      expect(image.getAttribute("src")).toContain("/brand/logo3.svg");
    });
  });

  it("preserves no-image text when fallback is disabled", () => {
    render(
      <HealthProjectCard
        project={buildProject({ imageUrl: undefined })}
        useLogoFallback={false}
      />
    );

    expect(screen.getByText("No image available")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Health Project Test" })).not.toBeInTheDocument();
  });
});
