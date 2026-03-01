import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CitizenAccountModal from "@/features/citizen/components/citizen-account-modal";

const mockFrom = vi.fn();
const mockEmitCitizenAuthChanged = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/features/citizen/auth/utils/auth-sync", () => ({
  emitCitizenAuthChanged: () => mockEmitCitizenAuthChanged(),
}));

const baseProfile = {
  fullName: "Juan Dela Cruz",
  email: "juan@example.com",
  firstName: "Juan",
  lastName: "Dela Cruz",
  barangay: "Barangay Uno",
  city: "Cabuyao",
  province: "Laguna",
};

function setupGeoMocks() {
  mockFrom.mockImplementation((table: string) => {
    if (table === "provinces") {
      return {
        select: () => ({
          eq: async () => ({
            data: [{ id: "prov-1", name: "Laguna", is_active: true }],
            error: null,
          }),
        }),
      };
    }
    if (table === "cities") {
      return {
        select: () => ({
          eq: async () => ({
            data: [{ id: "city-1", name: "Cabuyao", province_id: "prov-1", is_active: true }],
            error: null,
          }),
        }),
      };
    }
    if (table === "municipalities") {
      return {
        select: () => ({
          eq: async () => ({
            data: [],
            error: null,
          }),
        }),
      };
    }
    if (table === "barangays") {
      return {
        select: () => ({
          eq: async () => ({
            data: [{ id: "brgy-1", name: "Barangay Uno", city_id: "city-1", municipality_id: null, is_active: true }],
            error: null,
          }),
        }),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });
}

describe("CitizenAccountModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupGeoMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows read-only account details by default", () => {
    render(
      <CitizenAccountModal
        open
        onOpenChange={vi.fn()}
        profile={baseProfile}
        onSaved={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Juan Dela Cruz")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("juan@example.com")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Laguna")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Cabuyao")).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Barangay Uno")).toHaveAttribute("readonly");
  });

  it("keeps email read-only while in edit mode", async () => {
    render(
      <CitizenAccountModal
        open
        onOpenChange={vi.fn()}
        profile={baseProfile}
        onSaved={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByDisplayValue("juan@example.com")).toHaveAttribute("readonly");
  });

  it("saves edited profile via /profile/complete", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);
    const onSaved = vi.fn();

    render(
      <CitizenAccountModal
        open
        onOpenChange={vi.fn()}
        profile={baseProfile}
        onSaved={onSaved}
        onLoggedOut={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const fullNameInput = screen.getByLabelText("Full Name");
    fireEvent.change(fullNameInput, { target: { value: "Juan Miguel Dela Cruz" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/profile/complete",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    const saveCall = fetchMock.mock.calls.find((call) => call[0] === "/profile/complete");
    const requestPayload = JSON.parse(String((saveCall?.[1] as RequestInit).body ?? "{}"));

    expect(requestPayload).toEqual({
      fullName: "Juan Miguel Dela Cruz",
      province: "Laguna",
      city: "Cabuyao",
      barangay: "Barangay Uno",
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("disables Save until there is an actual change", async () => {
    render(
      <CitizenAccountModal
        open
        onOpenChange={vi.fn()}
        profile={baseProfile}
        onSaved={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const fullNameInput = screen.getByLabelText("Full Name");
    fireEvent.change(fullNameInput, { target: { value: "Juan Miguel Dela Cruz" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("disables Save again when changes are reverted", async () => {
    render(
      <CitizenAccountModal
        open
        onOpenChange={vi.fn()}
        profile={baseProfile}
        onSaved={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const fullNameInput = screen.getByLabelText("Full Name");

    fireEvent.change(fullNameInput, { target: { value: "Juan Miguel Dela Cruz" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

    fireEvent.change(fullNameInput, { target: { value: "Juan Dela Cruz" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("logs out successfully from the modal", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);
    const onOpenChange = vi.fn();
    const onLoggedOut = vi.fn();

    render(
      <CitizenAccountModal
        open
        onOpenChange={onOpenChange}
        profile={baseProfile}
        onSaved={vi.fn()}
        onLoggedOut={onLoggedOut}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/auth/sign-out",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLoggedOut).toHaveBeenCalledTimes(1);
    expect(mockEmitCitizenAuthChanged).toHaveBeenCalledTimes(1);
  });

  it("shows an inline error when logout fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: { message: "Logout failed" } }),
    } as Response);

    render(
      <CitizenAccountModal
        open
        onOpenChange={vi.fn()}
        profile={baseProfile}
        onSaved={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Logout failed");
    });
  });
});
