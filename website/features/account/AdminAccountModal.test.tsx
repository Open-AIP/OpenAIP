import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAccountModal from "@/features/account/AdminAccountModal";

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
  fullName: "Admin User",
  email: "admin@example.com",
  role: "admin" as const,
};

describe("AdminAccountModal", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockSignOut.mockReset();
  });

  it("shows read-only account information for full name, email, and role", () => {
    render(<AdminAccountModal open onOpenChange={vi.fn()} user={baseUser} />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Account Information")).toBeInTheDocument();

    const fullNameInput = screen.getByDisplayValue("Admin User");
    const emailInput = screen.getByDisplayValue("admin@example.com");
    const roleInput = screen.getByDisplayValue("Admin");

    expect(fullNameInput).toHaveAttribute("readonly");
    expect(emailInput).toHaveAttribute("readonly");
    expect(roleInput).toHaveAttribute("readonly");
  });

  it("logs out successfully and redirects to the admin sign-in route", async () => {
    const onOpenChange = vi.fn();
    mockSignOut.mockResolvedValue({ error: null });

    render(<AdminAccountModal open onOpenChange={onOpenChange} user={baseUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockReplace).toHaveBeenCalledWith("/admin/sign-in");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows an inline error when logout fails", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "Logout failed" } });

    render(<AdminAccountModal open onOpenChange={vi.fn()} user={baseUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Logout failed");
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
