import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostUpdateForm from "./post-update-form";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

function fillCommonFields() {
  fireEvent.change(
    screen.getByPlaceholderText("e.g., First vaccination drive completed"),
    { target: { value: "First milestone" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText("Describe what was accomplished in this update..."),
    { target: { value: "Completed the first site inspection and mobilization." } }
  );
}

function fillHealthAttendance() {
  fireEvent.change(screen.getByPlaceholderText("Number of participants"), {
    target: { value: "25" },
  });
}

describe("PostUpdateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes progress from current progress context", () => {
    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="health"
        currentProgressPercent={42}
        currentParticipantsReached={0}
        onCreate={vi.fn()}
      />
    );

    expect(screen.getByRole("slider")).toHaveAttribute("value", "42");
    expect(
      screen.getByText("Current progress: 42%. New update must be greater than 42%.")
    ).toBeInTheDocument();
  });

  it("keeps Post Update disabled when progress is not strictly higher than current", () => {
    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="health"
        currentProgressPercent={30}
        currentParticipantsReached={0}
        onCreate={vi.fn()}
      />
    );

    fillCommonFields();
    fillHealthAttendance();

    expect(screen.getByRole("button", { name: "Post Update" })).toBeDisabled();
  });

  it("posts update only when progress is strictly higher than current", async () => {
    const onCreate = vi.fn();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          update: {
            id: "u-1",
            title: "First milestone",
            date: "February 26, 2026",
            description: "Completed the first site inspection and mobilization.",
            progressPercent: 31,
            attendanceCount: 25,
            photoUrls: [],
          },
        }),
      } as Response);

    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="health"
        currentProgressPercent={30}
        currentParticipantsReached={10}
        onCreate={onCreate}
      />
    );
    fillCommonFields();
    fillHealthAttendance();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "31" } });

    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/barangay/projects/PROJ-001/updates");
    expect(init?.method).toBe("POST");

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "u-1",
          title: "First milestone",
        })
      )
    );
  });

  it("refreshes page when backend success response omits update payload", async () => {
    const onCreate = vi.fn();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="city"
        projectKind="infrastructure"
        currentProgressPercent={0}
        currentParticipantsReached={0}
        onCreate={onCreate}
      />
    );
    fillCommonFields();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });

    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(onCreate).not.toHaveBeenCalled();

    const [, init] = fetchMock.mock.calls[0];
    const formData = init?.body as FormData;
    expect(formData.get("attendanceCount")).toBeNull();
  });

  it("shows inline participants reached/target for health context", () => {
    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="health"
        currentProgressPercent={0}
        currentParticipantsReached={45}
        participantsTargetTotal={120}
        onCreate={vi.fn()}
      />
    );

    expect(screen.getByText(/Current participants reached:/)).toBeInTheDocument();
    expect(screen.getByText(/45 \/ 120/)).toBeInTheDocument();
  });

  it("does not show participants target inline metric when target is not provided", () => {
    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="health"
        currentProgressPercent={0}
        currentParticipantsReached={45}
        onCreate={vi.fn()}
      />
    );

    expect(screen.queryByText(/Current participants reached:/)).not.toBeInTheDocument();
  });

  it("disables posting and shows message when current progress is already 100", () => {
    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="health"
        currentProgressPercent={100}
        currentParticipantsReached={0}
        onCreate={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        "Current progress is already 100%. You can no longer post a higher progress update."
    )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post Update" })).toBeDisabled();
  });

  it("hides attendance field for infrastructure and allows submit without it", async () => {
    const onCreate = vi.fn();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        update: {
          id: "u-2",
          title: "First milestone",
          date: "February 26, 2026",
          description: "Completed the first site inspection and mobilization.",
          progressPercent: 31,
          photoUrls: [],
        },
      }),
    } as Response);

    render(
      <PostUpdateForm
        projectId="PROJ-001"
        scope="barangay"
        projectKind="infrastructure"
        currentProgressPercent={30}
        currentParticipantsReached={0}
        onCreate={onCreate}
      />
    );

    fillCommonFields();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "31" } });

    expect(screen.queryByText("Attendance Count *")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    const formData = init?.body as FormData;
    expect(formData.get("attendanceCount")).toBeNull();
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
  });
});
