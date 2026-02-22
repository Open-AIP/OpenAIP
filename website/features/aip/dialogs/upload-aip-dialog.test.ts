import { describe, expect, it } from "vitest";

import { buildUploadAipYears } from "./upload-aip-dialog";

describe("buildUploadAipYears", () => {
  it("returns six years from next year to four years prior", () => {
    const years = buildUploadAipYears(2026);

    expect(years).toEqual([2027, 2026, 2025, 2024, 2023, 2022]);
    expect(years).toHaveLength(6);
    expect(years).not.toContain(2028);
    expect(years).not.toContain(2021);
  });
});
