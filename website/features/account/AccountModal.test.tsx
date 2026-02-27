import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountModal from "./AccountModal";

const { mockReplace, mockRefresh, mockSignOut } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

const baseUser = {
  fullName: "Barangay User",
  email: "barangay@example.gov.ph",
  position: "Barangay Official",
  office: "Barangay Hall",
  role: "barangay" as const,
};

describe("AccountModal", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockSignOut.mockReset();
  });

  it("shows read-only account information with one managed-by-admin note and no password section", () => {
    render(<AccountModal open onOpenChange={vi.fn()} user={baseUser} />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Account Information")).toBeInTheDocument();
    expect(screen.getByText("Managed by Admin")).toBeInTheDocument();
    expect(screen.getAllByText("Managed by Admin")).toHaveLength(1);
    expect(screen.queryByText("Set Your Password")).not.toBeInTheDocument();

    const nameInput = screen.getByDisplayValue("Barangay User");
    const emailInput = screen.getByDisplayValue("barangay@example.gov.ph");
    const positionInput = screen.getByDisplayValue("Barangay Official");
    const officeInput = screen.getByDisplayValue("Barangay Hall");

    expect(nameInput).toHaveAttribute("readonly");
    expect(emailInput).toHaveAttribute("readonly");
    expect(positionInput).toHaveAttribute("readonly");
    expect(officeInput).toHaveAttribute("readonly");
  });

  it("logs out successfully and redirects to the LGU sign-in route", async () => {
    const onOpenChange = vi.fn();
    mockSignOut.mockResolvedValue({ error: null });

    render(<AccountModal open onOpenChange={onOpenChange} user={baseUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockReplace).toHaveBeenCalledWith("/barangay/sign-in");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows an inline error when logout fails", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "Logout failed" } });

    render(<AccountModal open onOpenChange={vi.fn()} user={baseUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Logout failed");
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
