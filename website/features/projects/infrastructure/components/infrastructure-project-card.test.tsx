import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { InfrastructureProject } from "@/features/projects/types";
import InfrastructureProjectCard from "./infrastructure-project-card";

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

function buildProject(
  overrides: Partial<InfrastructureProject> = {}
): InfrastructureProject {
  return {
    id: "PROJ-I-TEST-001",
    kind: "infrastructure",
    year: 2026,
    title: "Infrastructure Project Test",
    status: "planning",
    imageUrl: "/mock/infra/infra1.jpg",
    description: "Infrastructure project description",
    startDate: "2026-01-01",
    targetCompletionDate: "2026-06-01",
    implementingOffice: "Barangay Engineering Office",
    fundingSource: "General Fund",
    contractorName: "Build Co",
    contractCost: 500000,
    updates: [],
    ...overrides,
  };
}

describe("InfrastructureProjectCard image fallback", () => {
  it("uses logo fallback when image is missing and fallback is enabled", () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({ imageUrl: undefined })}
        useLogoFallback
      />
    );

    const image = screen.getByRole("img", { name: "Infrastructure Project Test" });
    expect(image.getAttribute("src")).toContain("/brand/logo3.svg");
  });

  it("uses logo fallback when image is default placeholder and fallback is enabled", () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({ imageUrl: "/default/default-no-image.jpg" })}
        useLogoFallback
      />
    );

    const image = screen.getByRole("img", { name: "Infrastructure Project Test" });
    expect(image.getAttribute("src")).toContain("/brand/logo3.svg");
  });

  it("preserves default placeholder when fallback is disabled", () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({ imageUrl: undefined })}
        useLogoFallback={false}
      />
    );

    const image = screen.getByRole("img", { name: "Infrastructure Project Test" });
    expect(image.getAttribute("src")).toContain("/default/default-no-image.jpg");
  });

  it("switches to logo on image load error when fallback is enabled", async () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({ imageUrl: "/broken/custom-image.jpg" })}
        useLogoFallback
      />
    );

    const image = screen.getByRole("img", { name: "Infrastructure Project Test" });
    expect(image.getAttribute("src")).toContain("/broken/custom-image.jpg");

    fireEvent.error(image);

    await waitFor(() => {
      expect(image.getAttribute("src")).toContain("/brand/logo3.svg");
    });
  });
});

describe("InfrastructureProjectCard date rendering", () => {
  it("renders full date range when both dates are valid", () => {
    render(<InfrastructureProjectCard project={buildProject()} />);

    expect(screen.getByText("January 1, 2026 - June 1, 2026")).toBeInTheDocument();
  });

  it("renders one-sided label when only start date is valid", () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({
          targetCompletionDate: "unknown date",
        })}
      />
    );

    expect(screen.getByText("Starts January 1, 2026")).toBeInTheDocument();
  });

  it("renders one-sided label when only end date is valid", () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({
          startDate: "unknown date",
        })}
      />
    );

    expect(screen.getByText("Ends June 1, 2026")).toBeInTheDocument();
  });

  it("renders N/A when both dates are invalid", () => {
    render(
      <InfrastructureProjectCard
        project={buildProject({
          startDate: "Unknown date",
          targetCompletionDate: "invalid date",
        })}
      />
    );

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
