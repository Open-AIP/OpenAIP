export type UpdateProjectCategory = "health" | "infrastructure";

export function normalizeAttendanceForProjectCategory(input: {
  projectCategory: UpdateProjectCategory;
  attendanceRaw: string | null;
  parseNonNegativeInteger: (value: string, label: string) => number;
}): number | null {
  if (input.projectCategory !== "health") {
    return null;
  }

  if (input.attendanceRaw === null) {
    return null;
  }

  return input.parseNonNegativeInteger(input.attendanceRaw, "Attendance count");
}
