import type { RoleType } from "@/lib/contracts/databasev2";

export type FeedbackAuthorDisplayRole =
  | "citizen"
  | "barangay_official"
  | "city_official"
  | "admin";

export function normalizeBarangayName(name: string): string {
  return name.replace(/^(brgy\.?|barangay)\s+/i, "").trim();
}

export function normalizeCityName(name: string): string {
  return name.replace(/^city of\s+/i, "").trim();
}

export function toFeedbackAuthorDisplayRole(
  role: RoleType | null | undefined
): FeedbackAuthorDisplayRole {
  if (role === "barangay_official") return "barangay_official";
  if (role === "city_official" || role === "municipal_official") return "city_official";
  if (role === "admin") return "admin";
  return "citizen";
}

export function toFeedbackRoleLabel(role: FeedbackAuthorDisplayRole): string {
  if (role === "barangay_official") return "Barangay Official";
  if (role === "city_official") return "City Official";
  if (role === "admin") return "Admin";
  return "Citizen";
}

export function buildFeedbackLguLabel(input: {
  role: RoleType | null | undefined;
  barangayName?: string | null;
  cityName?: string | null;
  municipalityName?: string | null;
}): string {
  if (input.role === "admin") {
    return "System Admin";
  }

  if (input.role === "citizen" || input.role === "barangay_official") {
    const normalized = input.barangayName ? normalizeBarangayName(input.barangayName) : "";
    return normalized ? `Brgy. ${normalized}` : "Brgy. Unknown";
  }

  if (input.role === "city_official" || input.role === "municipal_official") {
    const normalized = normalizeCityName(input.cityName ?? input.municipalityName ?? "");
    return normalized ? `City of ${normalized}` : "City of Unknown";
  }

  return "Brgy. Unknown";
}
