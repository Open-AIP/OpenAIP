import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminSidebar from "@/components/layout/admin-sidebar";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? "")} />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

describe("AdminSidebar", () => {
  it("does not render a logout button in the sidebar navigation", () => {
    render(<AdminSidebar />);

    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});
