import type { CityRow, BarangayRow } from "@/lib/contracts/databasev2";
import type { ChatScopeVM } from "@/lib/types/viewmodels";

export type ScopeFilters = {
  scope_type: "city" | "barangay";
  scope_id: string;
  fiscal_year: number;
  search: string;
};

export function parseScopeType(value: string | null): ScopeFilters["scope_type"] {
  return value === "barangay" ? "barangay" : "city";
}

export function parseFiscalYear(value: string | null): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;
  return new Date().getFullYear();
}

export function readScopeFromUrl(searchParams: URLSearchParams): ScopeFilters {
  return {
    scope_type: parseScopeType(searchParams.get("scope_type")),
    scope_id: searchParams.get("scope_id") ?? "",
    fiscal_year: parseFiscalYear(searchParams.get("fiscal_year")),
    search: searchParams.get("q") ?? "",
  };
}

export function buildScopeLabel(
  scopeType: ScopeFilters["scope_type"],
  scopeId: string,
  cities: CityRow[],
  barangays: BarangayRow[]
): string {
  if (scopeType === "city") {
    return cities.find((city) => city.id === scopeId)?.name ?? "Selected City";
  }
  const barangayName = barangays.find((barangay) => barangay.id === scopeId)?.name;
  return barangayName ? `Brgy. ${barangayName}` : "Selected Barangay";
}

export function toScopeVM(input: {
  scopeType: ScopeFilters["scope_type"];
  scopeId: string;
  fiscalYear: number;
  label: string;
}): ChatScopeVM {
  return {
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    fiscalYear: input.fiscalYear,
    label: input.label,
  };
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

export function buildAssistantStubReply(content: string): string {
  if (content.toLowerCase().includes("budget")) {
    return (
      "I can summarize published budget allocations by category, fiscal year, or LGU. " +
      "Try asking about total allocations, top funded projects, or specific service categories."
    );
  }

  if (content.toLowerCase().includes("project")) {
    return "I can help you explore published projects by type, scope, or fiscal year. What should I look up?";
  }

  return "Thanks for the question. I can answer using published AIPs and public project data. What would you like to know?";
}

export function defaultScopeVM(): ChatScopeVM {
  return {
    scopeType: "city",
    scopeId: "",
    fiscalYear: new Date().getFullYear(),
    label: "Selected LGU",
  };
}
