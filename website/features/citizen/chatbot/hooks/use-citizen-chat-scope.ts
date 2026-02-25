import { useMemo } from "react";
import type { Json } from "@/lib/contracts/databasev2";
import type { CitizenChatScopeChip } from "../types/citizen-chatbot.types";

function readContextObject(context: Json): Record<string, unknown> | null {
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;
  return context as Record<string, unknown>;
}

function toText(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed.length ? trimmed : null;
}

export function useCitizenChatScope(context: Json): CitizenChatScopeChip[] {
  return useMemo(() => {
    const row = readContextObject(context);
    if (!row) {
      return [{ id: "scope", label: "Scope: Citizen Account" }];
    }

    const scopeLabel = toText(row.scopeLabel) ?? toText(row.scope) ?? "Citizen Account";
    const fiscalYearLabel = toText(row.fiscalYearLabel) ?? toText(row.fiscalYear) ?? null;

    const chips: CitizenChatScopeChip[] = [{ id: "scope", label: `Scope: ${scopeLabel}` }];
    if (fiscalYearLabel) {
      chips.push({ id: "fy", label: `FY: ${fiscalYearLabel}` });
    }

    return chips;
  }, [context]);
}
