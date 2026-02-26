import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostUpdateForm from "./post-update-form";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

function fillRequiredFields() {
  fireEvent.change(
    screen.getByPlaceholderText("e.g., First vaccination drive completed"),
    { target: { value: "First milestone" } }
  );
  fireEvent.change(
    screen.getByPlaceholderText("Describe what was accomplished in this update..."),
    { target: { value: "Completed the first site inspection and mobilization." } }
  );
  fireEvent.change(screen.getByPlaceholderText("Number of participants"), {
    target: { value: "25" },
  });
}

describe("PostUpdateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts update to scoped endpoint and emits persisted update payload", async () => {
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
            progressPercent: 10,
            attendanceCount: 25,
            photoUrls: [],
          },
        }),
      } as Response);

    render(
      <PostUpdateForm projectId="PROJ-001" scope="barangay" onCreate={onCreate} />
    );
    fillRequiredFields();

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
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<PostUpdateForm projectId="PROJ-001" scope="city" onCreate={onCreate} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(onCreate).not.toHaveBeenCalled();
  });
});
