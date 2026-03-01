import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTypedAppSetting = vi.fn();

vi.mock("@/lib/settings/app-settings", () => ({
  getTypedAppSetting: (...args: unknown[]) => mockGetTypedAppSetting(...args),
}));

describe("citizen about-us content resolver", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("falls back to deterministic defaults when settings payload is malformed", async () => {
    mockGetTypedAppSetting.mockResolvedValue({
      referenceDocs: "invalid-shape",
      quickLinks: "invalid-shape",
    });

    const { getCitizenAboutUsContentVM } = await import("@/lib/content/citizen-about-us");
    const vm = await getCitizenAboutUsContentVM();

    expect(vm.quickLinksById).toEqual({
      dashboard: "/",
      budget_allocation: "/budget-allocation",
      aips: "/aips",
      projects: "/projects",
    });

    expect(vm.referenceDocs).toHaveLength(4);
    expect(vm.referenceDocs.every((doc) => doc.href === null)).toBe(true);
  });

  it("uses configured safe links and hides malformed ones", async () => {
    mockGetTypedAppSetting.mockResolvedValue({
      referenceDocs: [
        {
          id: "dbm_primer_cover",
          title: "DBM Primer",
          source: "Source: DBM",
          kind: "storage",
          bucketId: "about-us-docs",
          objectName: "reference/dbm-primer-cover.pdf",
        },
        {
          id: "ra_7160",
          title: "RA 7160",
          source: "Source: Official Code",
          kind: "external",
          externalUrl: "http://not-https.example.com/unsafe.pdf",
        },
      ],
      quickLinks: [
        { id: "projects", href: "/projects/infrastructure" },
        { id: "aips", href: "https://unsafe.example.com" },
      ],
    });

    const { getCitizenAboutUsContentVM } = await import("@/lib/content/citizen-about-us");
    const vm = await getCitizenAboutUsContentVM();

    const dbmDoc = vm.referenceDocs.find((doc) => doc.id === "dbm_primer_cover");
    const raDoc = vm.referenceDocs.find((doc) => doc.id === "ra_7160");

    expect(dbmDoc?.href).toBe("/api/citizen/about-us/reference/dbm_primer_cover");
    expect(raDoc?.href).toBeNull();
    expect(vm.quickLinksById.projects).toBe("/projects/infrastructure");
    expect(vm.quickLinksById.aips).toBe("/aips");
  });
});
