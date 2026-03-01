import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSecuritySettings = vi.fn();
const mockToSecurityPolicyResponse = vi.fn();
const mockGetActiveSystemBanner = vi.fn();

vi.mock("@/lib/security/security-settings.server", () => ({
  getSecuritySettings: (...args: unknown[]) => mockGetSecuritySettings(...args),
  toSecurityPolicyResponse: (...args: unknown[]) => mockToSecurityPolicyResponse(...args),
}));

vi.mock("@/lib/system-banner/system-banner.server", () => ({
  getActiveSystemBanner: (...args: unknown[]) => mockGetActiveSystemBanner(...args),
}));

describe("public system routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("GET /api/system/security-policy returns policy payload", async () => {
    const settings = {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
      sessionTimeout: {
        timeoutValue: 30,
        timeUnit: "minutes",
        warningMinutes: 5,
      },
      loginAttemptLimits: {
        maxAttempts: 5,
        lockoutDuration: 30,
        lockoutUnit: "minutes",
      },
    };
    const policyResponse = {
      securitySettings: settings,
      computed: {
        sessionTimeoutMs: 1_800_000,
        warningMs: 300_000,
        lockoutDurationMs: 1_800_000,
      },
    };
    mockGetSecuritySettings.mockResolvedValue(settings);
    mockToSecurityPolicyResponse.mockReturnValue(policyResponse);

    const { GET } = await import("@/app/api/system/security-policy/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toEqual(policyResponse);
  });

  it("GET /api/system/banner returns the active published banner", async () => {
    const banner = {
      title: "Maintenance Notice",
      message: "Services may be delayed.",
      severity: "Warning",
      startAt: null,
      endAt: null,
      publishedAt: "2026-03-01T00:00:00.000Z",
    };
    mockGetActiveSystemBanner.mockResolvedValue(banner);

    const { GET } = await import("@/app/api/system/banner/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toEqual({ banner });
  });
});

