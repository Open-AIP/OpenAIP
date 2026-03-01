import "server-only";

import type { CitizenAboutUsContentValue } from "@/lib/settings/app-settings";
import { getTypedAppSetting } from "@/lib/settings/app-settings";

export type CitizenAboutUsReferenceDocVM = {
  id: string;
  title: string;
  source: string;
  href: string | null;
};

export type CitizenAboutUsContentVM = {
  referenceDocs: CitizenAboutUsReferenceDocVM[];
  quickLinksById: Record<string, string>;
};

export type CitizenAboutUsResolvedReferenceDoc =
  | {
      id: string;
      title: string;
      source: string;
      kind: "storage";
      bucketId: string;
      objectName: string;
    }
  | {
      id: string;
      title: string;
      source: string;
      kind: "external";
      externalUrl: string;
    };

type ReferenceDocTemplate = {
  id: string;
  title: string;
  source: string;
};

const REFERENCE_DOC_TEMPLATES: ReferenceDocTemplate[] = [
  {
    id: "dbm_primer_cover",
    title: "DBM Primer Cover (Volume 1)",
    source: "Source: DBM",
  },
  {
    id: "dbm_primer_cover_volume_2",
    title: "DBM Primer Cover (Volume 2)",
    source: "Source: DBM",
  },
  {
    id: "ra_7160",
    title: "RA 7160",
    source: "Source: Official Code",
  },
  {
    id: "lbm_92_fy_2026",
    title: "LBM No. 92, FY 2026",
    source: "Source: DBM",
  },
];

const QUICK_LINK_DEFAULTS: Array<{ id: string; href: string }> = [
  { id: "dashboard", href: "/" },
  { id: "budget_allocation", href: "/budget-allocation" },
  { id: "aips", href: "/aips" },
  { id: "projects", href: "/projects" },
];

function normalizeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeLabel(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function hasProtocolPrefix(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(value);
}

function toSafeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized.startsWith("/")) return null;
  if (normalized.startsWith("//")) return null;
  if (hasProtocolPrefix(normalized)) return null;
  return normalized;
}

function toSafeExternalHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeReferenceDoc(doc: unknown): CitizenAboutUsResolvedReferenceDoc | null {
  if (!doc || typeof doc !== "object") return null;
  const row = doc as Record<string, unknown>;

  const id = normalizeId(row.id);
  if (!id) return null;

  const title = normalizeLabel(row.title, id);
  const source = normalizeLabel(row.source, "Source: Official Document");
  const kind = row.kind;

  if (kind === "storage") {
    const bucketId = normalizeId(row.bucketId);
    const objectName = normalizeId(row.objectName);
    if (!bucketId || !objectName) return null;
    return {
      id,
      title,
      source,
      kind: "storage",
      bucketId,
      objectName,
    };
  }

  if (kind === "external") {
    const externalUrl = toSafeExternalHttpsUrl(row.externalUrl);
    if (!externalUrl) return null;
    return {
      id,
      title,
      source,
      kind: "external",
      externalUrl,
    };
  }

  return null;
}

function getNormalizedReferenceDocMap(
  content: CitizenAboutUsContentValue
): Map<string, CitizenAboutUsResolvedReferenceDoc> {
  const docRows = Array.isArray(content?.referenceDocs) ? content.referenceDocs : [];
  const map = new Map<string, CitizenAboutUsResolvedReferenceDoc>();
  for (const doc of docRows) {
    const normalized = normalizeReferenceDoc(doc);
    if (!normalized) continue;
    if (!map.has(normalized.id)) {
      map.set(normalized.id, normalized);
    }
  }
  return map;
}

function getNormalizedQuickLinks(content: CitizenAboutUsContentValue): Record<string, string> {
  const merged = Object.fromEntries(QUICK_LINK_DEFAULTS.map((item) => [item.id, item.href]));
  const quickLinkRows = Array.isArray(content?.quickLinks) ? content.quickLinks : [];

  for (const link of quickLinkRows) {
    if (!link || typeof link !== "object") continue;
    const row = link as Record<string, unknown>;
    const id = normalizeId(row.id);
    const href = toSafeInternalPath(row.href);
    if (!id || !href) continue;
    if (!(id in merged)) continue;
    merged[id] = href;
  }

  return merged;
}

export async function getCitizenAboutUsContentVM(): Promise<CitizenAboutUsContentVM> {
  const content = await getTypedAppSetting("content.citizen_about_us");
  const docsById = getNormalizedReferenceDocMap(content);
  const quickLinksById = getNormalizedQuickLinks(content);

  return {
    quickLinksById,
    referenceDocs: REFERENCE_DOC_TEMPLATES.map((template) => {
      const normalized = docsById.get(template.id);
      if (!normalized) {
        return {
          id: template.id,
          title: template.title,
          source: template.source,
          href: null,
        };
      }

      return {
        id: template.id,
        title: normalizeLabel(normalized.title, template.title),
        source: normalizeLabel(normalized.source, template.source),
        href: `/api/citizen/about-us/reference/${encodeURIComponent(template.id)}`,
      };
    }),
  };
}

export async function getCitizenAboutUsReferenceDocById(
  docId: string
): Promise<CitizenAboutUsResolvedReferenceDoc | null> {
  const normalizedDocId = normalizeId(docId);
  if (!normalizedDocId) return null;

  const content = await getTypedAppSetting("content.citizen_about_us");
  const docsById = getNormalizedReferenceDocMap(content);
  return docsById.get(normalizedDocId) ?? null;
}
