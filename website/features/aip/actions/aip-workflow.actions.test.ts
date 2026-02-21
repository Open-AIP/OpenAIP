import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAppEnv = vi.fn<() => "dev" | "staging" | "prod">(() => "dev");
const mockIsMockEnabled = vi.fn(() => false);
const mockGetActorContext = vi.fn();
const mockGetAipDetail = vi.fn();
const mockSupabaseAdmin = vi.fn();
const mockSupabaseServer = vi.fn();

type UploadedFileRefRow = {
  bucket_id: string | null;
  object_name: string | null;
};

type ArtifactRefRow = {
  artifact_json: unknown;
};

type StorageRemoveCall = {
  bucket: string;
  paths: string[];
};

let uploadedFileRows: UploadedFileRefRow[] = [];
let artifactRows: ArtifactRefRow[] = [];
let uploadedFileQueryErrorMessage: string | null = null;
let artifactQueryErrorMessage: string | null = null;
let storageFailureBucket: string | null = null;
let dbDeleteErrorMessage: string | null = null;
let storageRemoveCalls: StorageRemoveCall[] = [];
let deleteAipsEqMock = vi.fn(async () => ({ error: null }));

vi.mock("@/lib/config/appEnv", () => ({
  getAppEnv: () => mockGetAppEnv(),
  isMockEnabled: () => mockIsMockEnabled(),
}));

vi.mock("@/lib/domain/get-actor-context", () => ({
  getActorContext: () => mockGetActorContext(),
}));

vi.mock("@/lib/repos/aip/repo.server", () => ({
  getAipRepo: vi.fn(() => ({
    getAipDetail: mockGetAipDetail,
    updateAipStatus: vi.fn(),
  })),
  getAipProjectRepo: vi.fn(() => ({
    listByAip: vi.fn(async () => []),
  })),
}));

vi.mock("@/lib/repos/feedback/repo.server", () => ({
  getFeedbackRepo: vi.fn(() => ({
    listForAip: vi.fn(async () => []),
    createForAip: vi.fn(async () => undefined),
  })),
}));

vi.mock("@/lib/repos/submissions/repo.mock", () => ({
  __appendMockAipReviewAction: vi.fn(),
  __getMockAipReviewsForAipId: vi.fn(() => []),
}));

vi.mock("@/mocks/fixtures/aip/aips.table.fixture", () => ({
  AIPS_TABLE: [],
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => mockSupabaseAdmin(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

import { deleteAipDraftAction } from "./aip-workflow.actions";

function createSupabaseServerClient() {
  return {
    from: (table: string) => {
      if (table !== "aip_reviews") {
        throw new Error(`Unexpected supabaseServer table in test: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      };
    },
  };
}

function createSupabaseAdminClient() {
  return {
    from: (table: string) => {
      if (table === "uploaded_files") {
        return {
          select: () => ({
            eq: async () => ({
              data: uploadedFileRows,
              error: uploadedFileQueryErrorMessage
                ? { message: uploadedFileQueryErrorMessage }
                : null,
            }),
          }),
        };
      }

      if (table === "extraction_artifacts") {
        return {
          select: () => ({
            eq: async () => ({
              data: artifactRows,
              error: artifactQueryErrorMessage ? { message: artifactQueryErrorMessage } : null,
            }),
          }),
        };
      }

      if (table === "aips") {
        return {
          delete: () => ({
            eq: deleteAipsEqMock,
          }),
        };
      }

      throw new Error(`Unexpected supabaseAdmin table in test: ${table}`);
    },
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          storageRemoveCalls.push({ bucket, paths: [...paths] });
          if (storageFailureBucket && bucket === storageFailureBucket) {
            return {
              data: null,
              error: { message: `remove failed for ${bucket}` },
            };
          }
          return { data: [], error: null };
        },
      }),
    },
  };
}

describe("deleteAipDraftAction strict storage-first deletion", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_STORAGE_ARTIFACT_BUCKET;

    uploadedFileRows = [];
    artifactRows = [];
    uploadedFileQueryErrorMessage = null;
    artifactQueryErrorMessage = null;
    storageFailureBucket = null;
    dbDeleteErrorMessage = null;
    storageRemoveCalls = [];
    deleteAipsEqMock = vi.fn(async () => ({
      error: dbDeleteErrorMessage ? { message: dbDeleteErrorMessage } : null,
    }));

    mockGetAppEnv.mockReturnValue("dev");
    mockIsMockEnabled.mockReturnValue(false);
    mockGetActorContext.mockResolvedValue(null);
    mockGetAipDetail.mockResolvedValue({
      id: "aip-001",
      scope: "barangay",
      status: "draft",
    });

    mockSupabaseAdmin.mockImplementation(() => createSupabaseAdminClient());
    mockSupabaseServer.mockImplementation(async () => createSupabaseServerClient());
  });

  it("deletes storage refs first across pdf and artifact buckets, then deletes the draft row", async () => {
    uploadedFileRows = [{ bucket_id: "aip-pdfs", object_name: "aip-001/source.pdf" }];
    artifactRows = [{ artifact_json: { storage_path: "runs/run-1/extract_1.json" } }];

    const result = await deleteAipDraftAction({ aipId: "aip-001" });

    expect(result).toEqual({ ok: true, message: "Draft AIP deleted successfully." });
    expect(storageRemoveCalls).toEqual([
      {
        bucket: "aip-artifacts",
        paths: ["runs/run-1/extract_1.json"],
      },
      {
        bucket: "aip-pdfs",
        paths: ["aip-001/source.pdf"],
      },
    ]);
    expect(deleteAipsEqMock).toHaveBeenCalledWith("id", "aip-001");
  });

  it("fails strictly and does not delete the AIP row when storage deletion fails", async () => {
    uploadedFileRows = [{ bucket_id: "aip-pdfs", object_name: "aip-001/source.pdf" }];
    artifactRows = [{ artifact_json: { storage_path: "runs/run-1/extract_1.json" } }];
    storageFailureBucket = "aip-artifacts";

    const result = await deleteAipDraftAction({ aipId: "aip-001" });

    expect(result).toEqual({
      ok: false,
      message: "Failed to delete one or more AIP files from storage. Draft was not deleted.",
    });
    expect(deleteAipsEqMock).not.toHaveBeenCalled();
  });

  it("deletes only uploaded file refs when artifact storage paths are missing", async () => {
    uploadedFileRows = [{ bucket_id: "aip-pdfs", object_name: "aip-001/source.pdf" }];
    artifactRows = [
      { artifact_json: null },
      { artifact_json: {} },
      { artifact_json: { storage_path: " " } },
      { artifact_json: { storage_path: null } },
    ];

    const result = await deleteAipDraftAction({ aipId: "aip-001" });

    expect(result).toEqual({ ok: true, message: "Draft AIP deleted successfully." });
    expect(storageRemoveCalls).toEqual([
      {
        bucket: "aip-pdfs",
        paths: ["aip-001/source.pdf"],
      },
    ]);
  });

  it("deduplicates storage refs and honors custom artifact bucket env", async () => {
    process.env.SUPABASE_STORAGE_ARTIFACT_BUCKET = "custom-artifacts";
    uploadedFileRows = [
      { bucket_id: "aip-pdfs", object_name: "aip-001/source-a.pdf" },
      { bucket_id: "aip-pdfs", object_name: "aip-001/source-a.pdf" },
      { bucket_id: "aip-pdfs", object_name: "aip-001/source-b.pdf" },
    ];
    artifactRows = [
      { artifact_json: { storage_path: "runs/run-1/extract_1.json" } },
      { artifact_json: { storage_path: "runs/run-1/extract_1.json" } },
      { artifact_json: { storage_path: "runs/run-1/validate_2.json" } },
    ];

    const result = await deleteAipDraftAction({ aipId: "aip-001" });

    expect(result).toEqual({ ok: true, message: "Draft AIP deleted successfully." });
    expect(storageRemoveCalls).toEqual([
      {
        bucket: "aip-pdfs",
        paths: ["aip-001/source-a.pdf", "aip-001/source-b.pdf"],
      },
      {
        bucket: "custom-artifacts",
        paths: ["runs/run-1/extract_1.json", "runs/run-1/validate_2.json"],
      },
    ]);
  });

  it("returns partial-outcome failure when DB row deletion fails after storage cleanup", async () => {
    uploadedFileRows = [{ bucket_id: "aip-pdfs", object_name: "aip-001/source.pdf" }];
    artifactRows = [{ artifact_json: { storage_path: "runs/run-1/extract_1.json" } }];
    dbDeleteErrorMessage = "delete failed";

    const result = await deleteAipDraftAction({ aipId: "aip-001" });

    expect(result).toEqual({
      ok: false,
      message: "Storage files were deleted but draft row deletion failed. Please contact admin.",
    });
    expect(storageRemoveCalls.length).toBeGreaterThan(0);
    expect(deleteAipsEqMock).toHaveBeenCalledWith("id", "aip-001");
  });

  it("keeps authorization guard behavior unchanged and avoids storage work when unauthorized", async () => {
    mockGetAppEnv.mockReturnValue("prod");
    mockGetActorContext.mockResolvedValue(null);

    const result = await deleteAipDraftAction({ aipId: "aip-001" });

    expect(result).toEqual({
      ok: false,
      message: "Unauthorized.",
    });
    expect(storageRemoveCalls).toEqual([]);
    expect(deleteAipsEqMock).not.toHaveBeenCalled();
  });
});
