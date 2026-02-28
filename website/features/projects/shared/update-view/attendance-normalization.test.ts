import { describe, expect, it, vi } from "vitest";
import { normalizeAttendanceForProjectCategory } from "@/app/api/projects/_shared/attendance-normalization";

describe("normalizeAttendanceForProjectCategory", () => {
  it("always returns null for infrastructure updates", () => {
    const parseNonNegativeInteger = vi.fn(() => 12);

    const result = normalizeAttendanceForProjectCategory({
      projectCategory: "infrastructure",
      attendanceRaw: "99",
      parseNonNegativeInteger,
    });

    expect(result).toBeNull();
    expect(parseNonNegativeInteger).not.toHaveBeenCalled();
  });

  it("returns null for health updates when attendance is missing", () => {
    const parseNonNegativeInteger = vi.fn(() => 12);

    const result = normalizeAttendanceForProjectCategory({
      projectCategory: "health",
      attendanceRaw: null,
      parseNonNegativeInteger,
    });

    expect(result).toBeNull();
    expect(parseNonNegativeInteger).not.toHaveBeenCalled();
  });

  it("parses attendance for health updates when provided", () => {
    const parseNonNegativeInteger = vi.fn(() => 25);

    const result = normalizeAttendanceForProjectCategory({
      projectCategory: "health",
      attendanceRaw: "25",
      parseNonNegativeInteger,
    });

    expect(result).toBe(25);
    expect(parseNonNegativeInteger).toHaveBeenCalledWith("25", "Attendance count");
  });
});
