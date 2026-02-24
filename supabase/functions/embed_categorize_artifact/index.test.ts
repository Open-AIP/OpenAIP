import { assert, assertEquals } from "jsr:@std/assert@1";

import { buildChunkPlan, handleRequest } from "./index.ts";

Deno.test("buildChunkPlan is deterministic for identical categorize input", () => {
  const args = {
    projectsRaw: [
      {
        aip_ref_code: "1000-2026-001",
        program_project_description: "Primary care expansion",
        source_of_funds: "General Fund",
        amounts: {
          personal_services: 100000,
          maintenance_and_other_operating_expenses: 200000,
          financial_expenses: 0,
          capital_outlay: 300000,
          total: 600000,
        },
        classification: {
          sector_code: "1000",
          category: "health",
        },
      },
      {
        aip_ref_code: "3000-2026-010",
        program_project_description: "Road rehabilitation and drainage works",
        source_of_funds: "Local Development Fund",
        amounts: {
          personal_services: 0,
          maintenance_and_other_operating_expenses: 100000,
          financial_expenses: 0,
          capital_outlay: 900000,
          total: 1000000,
        },
        classification: {
          sector_code: "3000",
          category: "infrastructure",
        },
      },
    ],
    context: {
      fiscalYear: 2026,
      scopeType: "barangay" as const,
      scopeId: "scope-id",
      scopeLabel: "Barangay: Mamatid",
    },
    artifactId: "artifact-id-123",
    artifactRunId: "run-id-123",
    aipId: "aip-id-123",
    scopeType: "barangay" as const,
    scopeId: "scope-id",
    sectorLabels: new Map<string, string>([
      ["1000", "General Services"],
      ["3000", "Social Services"],
      ["unknown", "Unknown Sector"],
    ]),
  };

  const first = buildChunkPlan(args);
  const second = buildChunkPlan(args);

  assertEquals(first, second);
  assertEquals(first.length, 2);
  assertEquals(first[0]?.chunkIndex, 0);
  assertEquals(first[1]?.chunkIndex, 1);
  assertEquals(first[0]?.metadata.chunk_kind, "project");
  assertEquals(first[1]?.metadata.chunk_kind, "project");
});

Deno.test("buildChunkPlan groups by category when per-project chunks are too short", () => {
  const projectsRaw = Array.from({ length: 8 }).map((_, idx) => ({
    aip_ref_code: `${idx % 2 === 0 ? "1000" : "3000"}-2026-00${idx + 1}`,
    program_project_description: `Short desc ${idx + 1}`,
    source_of_funds: "General Fund",
    amounts: {
      personal_services: 1,
      maintenance_and_other_operating_expenses: 2,
      financial_expenses: 3,
      capital_outlay: 4,
      total: 10,
    },
    classification: {
      sector_code: idx % 2 === 0 ? "1000" : "3000",
      category: idx % 2 === 0 ? "health" : "infrastructure",
    },
  }));

  const chunks = buildChunkPlan({
    projectsRaw,
    context: {
      fiscalYear: 2026,
      scopeType: "city" as const,
      scopeId: "scope-id",
      scopeLabel: "City: Sample",
    },
    artifactId: "artifact-id-456",
    artifactRunId: "run-id-456",
    aipId: "aip-id-456",
    scopeType: "city" as const,
    scopeId: "scope-id",
    sectorLabels: new Map<string, string>([
      ["1000", "General Services"],
      ["3000", "Social Services"],
      ["unknown", "Unknown Sector"],
    ]),
  });

  assert(chunks.length > 0);
  assertEquals(chunks[0]?.metadata.chunk_kind, "category_group");
});

Deno.test("handleRequest rejects missing/invalid job secret", async () => {
  Deno.env.set("EMBED_CATEGORIZE_JOB_SECRET", "expected-secret");

  const req = new Request("http://localhost/embed_categorize_artifact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aip_id: "aip-id-789" }),
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 401);
});
