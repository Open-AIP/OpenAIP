import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectUpdateUi } from "@/features/projects/types";
import UpdatesTimelineView from "./updates-timeline-view";

type MockedNextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: MockedNextImageProps) => {
    void fill;
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={props.alt ?? ""} {...props} />
    );
  },
}));

const LONG_TITLE = "Very long update title that should still be truncated visually in the feed card header";
const DESCRIPTION =
  "Completed major site preparation activities and coordinated with local stakeholders for the next implementation phase.";

const SINGLE_IMAGE_UPDATE: ProjectUpdateUi[] = [
  {
    id: "u-single",
    title: LONG_TITLE,
    date: "February 27, 2026",
    description: DESCRIPTION,
    progressPercent: 40,
    attendanceCount: 20,
    photoUrls: ["/mock/health/health1.jpg"],
  },
];

const MULTI_IMAGE_UPDATE: ProjectUpdateUi[] = [
  {
    id: "u-multi",
    title: "Milestone update",
    date: "February 27, 2026",
    description: DESCRIPTION,
    progressPercent: 60,
    photoUrls: [
      "/mock/health/health1.jpg",
      "/mock/health/health2.jpg",
      "/mock/health/health3.jpg",
      "/mock/health/health4.jpg",
      "/mock/health/health5.jpg",
      "/mock/health/health6.jpg",
      "/mock/health/health7.jpg",
    ],
  },
];

describe("UpdatesTimelineView", () => {
  it("renders feed-style header hierarchy and compact progress text", () => {
    render(<UpdatesTimelineView updates={SINGLE_IMAGE_UPDATE} />);

    const title = screen.getByText(LONG_TITLE);
    expect(title).toHaveClass("truncate");
    expect(title).toHaveAttribute("title", LONG_TITLE);
    expect(screen.getByText("February 27, 2026")).toBeInTheDocument();
    expect(screen.getByText("20 participants")).toBeInTheDocument();
    expect(screen.getByText("40% Complete")).toBeInTheDocument();
    expect(screen.getByText(DESCRIPTION)).toHaveClass("line-clamp-4", "leading-6");
    expect(document.querySelector('[data-slot="progress"]')).not.toBeInTheDocument();
  });

  it("renders one image as a large centered preview", () => {
    render(<UpdatesTimelineView updates={SINGLE_IMAGE_UPDATE} />);

    const imageTrigger = screen.getByRole("button", { name: "Open update image 1 of 1" });
    expect(imageTrigger).toHaveClass("w-[92%]", "sm:w-[85%]", "md:w-[420px]");
    expect(imageTrigger.parentElement).toHaveClass("justify-center");
  });

  it("renders multiple images in centered wrap layout with overflow indicator", () => {
    render(<UpdatesTimelineView updates={MULTI_IMAGE_UPDATE} />);

    const imageTriggers = screen.getAllByRole("button", { name: /Open update image/i });
    expect(imageTriggers).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Open update image 5 of 7" })).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("supports fullscreen viewer navigation, dots, and close actions", async () => {
    render(<UpdatesTimelineView updates={MULTI_IMAGE_UPDATE} />);

    fireEvent.click(screen.getByRole("button", { name: "Open update image 1 of 7" }));
    expect(await screen.findByText("1 / 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(await screen.findByText("2 / 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to image 4" }));
    expect(await screen.findByText("4 / 7")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(await screen.findByText("3 / 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    await waitFor(() => {
      expect(screen.queryByText("3 / 7")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open update image 1 of 7" }));
    expect(await screen.findByText("1 / 7")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("1 / 7")).not.toBeInTheDocument();
    });
  });

  it("keeps no-photo and no-update states working", () => {
    const noPhotoUpdate: ProjectUpdateUi[] = [
      {
        id: "u-no-photo",
        title: "No media update",
        date: "February 27, 2026",
        description: "No uploaded photos for this update",
        progressPercent: 10,
      },
    ];

    const { rerender } = render(<UpdatesTimelineView updates={noPhotoUpdate} />);
    expect(
      screen.queryByRole("button", { name: /Open update image/i })
    ).not.toBeInTheDocument();

    rerender(<UpdatesTimelineView updates={[]} />);
    expect(screen.getByText("No updates yet.")).toBeInTheDocument();
  });
});
