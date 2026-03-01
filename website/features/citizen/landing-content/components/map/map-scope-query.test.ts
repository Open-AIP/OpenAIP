import { describe, expect, it } from "vitest";
import { buildDashboardScopeHref } from "./map-scope-query";

describe("buildDashboardScopeHref", () => {
  it("builds a URL with scope and fiscal year params", () => {
    const href = buildDashboardScopeHref({
      pathname: "/",
      searchParams: new URLSearchParams("tab=overview"),
      scopeType: "barangay",
      scopeId: "scope-123",
      fiscalYear: 2026,
    });

    expect(href).toBe("/?tab=overview&scope_type=barangay&scope_id=scope-123&fiscal_year=2026");
  });

  it("returns null when selecting the already active scope", () => {
    const href = buildDashboardScopeHref({
      pathname: "/",
      searchParams: new URLSearchParams(
        "scope_type=barangay&scope_id=scope-123&fiscal_year=2026"
      ),
      scopeType: "barangay",
      scopeId: "scope-123",
      fiscalYear: 2026,
    });

    expect(href).toBeNull();
  });

  it("preserves current fiscal year when input year is missing", () => {
    const href = buildDashboardScopeHref({
      pathname: "/",
      searchParams: new URLSearchParams("scope_type=city&scope_id=city-1&fiscal_year=2025"),
      scopeType: "barangay",
      scopeId: "brgy-1",
    });

    expect(href).toBe("/?scope_type=barangay&scope_id=brgy-1&fiscal_year=2025");
  });
});
