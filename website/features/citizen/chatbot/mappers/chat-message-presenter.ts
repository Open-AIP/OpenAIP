import type { Json } from "@/lib/contracts/databasev2";
import type { CitizenChatFollowUp, CitizenChatEvidenceItem } from "../types/citizen-chatbot.types";

function normalizeText(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed.length ? trimmed : null;
}

export function mapEvidenceFromCitations(citations: Json | null): CitizenChatEvidenceItem[] {
  if (!Array.isArray(citations)) return [];

  return citations
    .map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;

      const row = entry as Record<string, unknown>;
      const snippet = normalizeText(row.snippet);
      if (!snippet) return null;

      return {
        id: normalizeText(row.id) ?? `evidence_${index + 1}`,
        documentLabel: normalizeText(row.documentLabel) ?? "Published AIP",
        snippet,
        fiscalYear: normalizeText(row.fiscalYear),
        pageOrSection: normalizeText(row.pageOrSection),
      };
    })
    .filter((item): item is CitizenChatEvidenceItem => item !== null);
}

export function mapFollowUpsFromRetrievalMeta(meta: Json | null): CitizenChatFollowUp[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];

  const source = (meta as { suggestedFollowUps?: unknown }).suggestedFollowUps;
  if (!Array.isArray(source)) return [];

  return source
    .map((value, index) => {
      const label = normalizeText(value);
      if (!label) return null;
      return {
        id: `follow_up_${index + 1}`,
        label,
      };
    })
    .filter((item): item is CitizenChatFollowUp => item !== null);
}
