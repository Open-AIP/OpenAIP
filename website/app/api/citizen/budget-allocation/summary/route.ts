import { NextResponse } from "next/server";
import { DBV2_SECTOR_CODES, getSectorLabel, type DashboardSectorCode } from "@/lib/constants/dashboard";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ScopeType = "city" | "barangay";

type SummaryErrorCode = "BAD_REQUEST" | "NOT_FOUND" | "INTERNAL_ERROR";

function errorResponse(status: number, code: SummaryErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function parseScope(searchParams: URLSearchParams): {
  fiscalYear: number;
  scopeType: ScopeType;
  scopeId: string;
} | null {
  const fiscalYearRaw = searchParams.get("fiscal_year");
  const scopeTypeRaw = searchParams.get("scope_type");
  const scopeId = searchParams.get("scope_id")?.trim() ?? "";

  const fiscalYear = Number(fiscalYearRaw);
  if (!Number.isInteger(fiscalYear) || fiscalYear < 1900) return null;
  if (scopeTypeRaw !== "city" && scopeTypeRaw !== "barangay") return null;
  if (!UUID_PATTERN.test(scopeId)) return null;

  return {
    fiscalYear,
    scopeType: scopeTypeRaw,
    scopeId,
  };
}

function toAmount(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET(request: Request) {
  const parsed = parseScope(new URL(request.url).searchParams);
  if (!parsed) {
    return errorResponse(
      400,
      "BAD_REQUEST",
      "Invalid or missing query params. Required: fiscal_year, scope_type (city|barangay), scope_id (UUID)."
    );
  }

  const scopeColumn = parsed.scopeType === "city" ? "city_id" : "barangay_id";
  const scopeTable = parsed.scopeType === "city" ? "cities" : "barangays";

  try {
    const client = await supabaseServer();

    const [{ data: scopeRow, error: scopeError }, { data: publishedAips, error: aipsError }] = await Promise.all([
      client.from(scopeTable).select("name").eq("id", parsed.scopeId).maybeSingle(),
      client
        .from("aips")
        .select("id,fiscal_year")
        .eq("status", "published")
        .eq(scopeColumn, parsed.scopeId)
        .lte("fiscal_year", parsed.fiscalYear)
        .order("fiscal_year", { ascending: false })
        .limit(5),
    ]);

    if (scopeError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to resolve scope details.");
    }
    if (aipsError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to load published budget allocation data.");
    }

    const selectedAip = (publishedAips ?? []).find((aip) => aip.fiscal_year === parsed.fiscalYear);
    if (!selectedAip) {
      return errorResponse(
        404,
        "NOT_FOUND",
        "No published budget allocation was found for the selected fiscal year and LGU scope."
      );
    }

    const trendAips = [...(publishedAips ?? [])].sort((a, b) => a.fiscal_year - b.fiscal_year);
    const trendAipIds = trendAips.map((aip) => aip.id);
    const yearByAipId = new Map(trendAips.map((aip) => [aip.id, aip.fiscal_year]));

    const [{ data: selectedProjects, error: selectedProjectsError }, { data: trendProjects, error: trendProjectsError }] =
      await Promise.all([
        client
          .from("projects")
          .select("sector_code,total")
          .eq("aip_id", selectedAip.id)
          .in("sector_code", [...DBV2_SECTOR_CODES]),
        client
          .from("projects")
          .select("aip_id,sector_code,total")
          .in("aip_id", trendAipIds)
          .in("sector_code", [...DBV2_SECTOR_CODES]),
      ]);

    if (selectedProjectsError || trendProjectsError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to load project budget totals.");
    }

    const totalsBySector = new Map<DashboardSectorCode, number>(DBV2_SECTOR_CODES.map((code) => [code, 0]));

    (selectedProjects ?? []).forEach((project) => {
      const code = project.sector_code as DashboardSectorCode;
      totalsBySector.set(code, (totalsBySector.get(code) ?? 0) + toAmount(project.total));
    });

    const overallTotal = DBV2_SECTOR_CODES.reduce((sum, code) => sum + (totalsBySector.get(code) ?? 0), 0);

    const bySector = DBV2_SECTOR_CODES.map((sectorCode) => {
      const total = totalsBySector.get(sectorCode) ?? 0;
      return {
        sector_code: sectorCode,
        sector_label: getSectorLabel(sectorCode),
        total,
        pct: overallTotal > 0 ? total / overallTotal : 0,
      };
    });

    const years = trendAips.map((aip) => aip.fiscal_year);
    const yearSectorTotals = new Map<number, Map<DashboardSectorCode, number>>();

    years.forEach((year) => {
      yearSectorTotals.set(year, new Map<DashboardSectorCode, number>(DBV2_SECTOR_CODES.map((code) => [code, 0])));
    });

    (trendProjects ?? []).forEach((project) => {
      const year = yearByAipId.get(project.aip_id);
      const code = project.sector_code as DashboardSectorCode;
      if (typeof year !== "number" || !yearSectorTotals.has(year)) return;
      const sectorMap = yearSectorTotals.get(year);
      if (!sectorMap) return;
      sectorMap.set(code, (sectorMap.get(code) ?? 0) + toAmount(project.total));
    });

    const series = DBV2_SECTOR_CODES.map((sectorCode) => ({
      sector_code: sectorCode,
      sector_label: getSectorLabel(sectorCode),
      values: years.map((year) => yearSectorTotals.get(year)?.get(sectorCode) ?? 0),
    }));

    return NextResponse.json({
      scope: {
        fiscal_year: parsed.fiscalYear,
        scope_type: parsed.scopeType,
        scope_id: parsed.scopeId,
        scope_name: scopeRow?.name ?? null,
      },
      totals: {
        overall_total: overallTotal,
        by_sector: bySector,
      },
      trend: {
        years,
        series,
      },
    });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unexpected error while loading budget allocation summary.");
  }
}
