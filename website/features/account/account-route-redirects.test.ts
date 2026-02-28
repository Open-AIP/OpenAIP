import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import BarangayAccountPage from "@/app/(lgu)/barangay/(authenticated)/account/page";
import CityAccountPage from "@/app/(lgu)/city/(authenticated)/account/page";

describe("LGU account routes", () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it("redirects barangay /account to /barangay", async () => {
    await BarangayAccountPage();
    expect(redirectMock).toHaveBeenCalledWith("/barangay");
  });

  it("redirects city /account to /city", async () => {
    await CityAccountPage();
    expect(redirectMock).toHaveBeenCalledWith("/city");
  });
});
