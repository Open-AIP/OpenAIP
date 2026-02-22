import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AipManagementView from "./aip-management-view";
import type { AipHeader } from "../types";
import type { UseExtractionRunsRealtimeInput } from "../hooks/use-extraction-runs-realtime";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let latestRealtimeArgs: UseExtractionRunsRealtimeInput | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/config/appEnv", () => ({
  isMockEnabled: () => false,
}));

vi.mock("../dialogs/upload-aip-dialog", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("../components/aip-card", () => ({
  __esModule: true,
  default: ({ aip }: { aip: AipHeader }) => (
    <div data-testid={`aip-card-${aip.id}`}>
      <span>{aip.id}</span>
      <span>{aip.processing?.state ?? "idle"}</span>
      <span>{String(aip.processing?.overallProgressPct ?? 0)}</span>
    </div>
  ),
}));

vi.mock("../hooks/use-extraction-runs-realtime", async () => {
  const actual = await vi.importActual<typeof import("../hooks/use-extraction-runs-realtime")>(
    "../hooks/use-extraction-runs-realtime"
  );
  return {
    ...actual,
    useExtractionRunsRealtime: vi.fn((args: UseExtractionRunsRealtimeInput) => {
      latestRealtimeArgs = args;
    }),
  };
});

function baseAip(id: string): AipHeader {
  return {
    id,
    scope: "barangay",
    barangayName: "Brgy. Test",
    title: `AIP ${id}`,
    description: "Description",
    year: 2026,
    budget: 1000000,
    uploadedAt: "2026-01-01",
    status: "draft",
    fileName: "aip.pdf",
    pdfUrl: "https://example.com/aip.pdf",
    sectors: ["General Sector"],
    uploader: {
      name: "Uploader",
      role: "Barangay Official",
      uploadDate: "Jan 1, 2026",
      budgetAllocated: 1000000,
    },
  };
}

describe("AipManagementView realtime updates", () => {
  beforeEach(() => {
    latestRealtimeArgs = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updates only the matching card when a run is running", async () => {
    render(
      <AipManagementView
        scope="barangay"
        records={[baseAip("aip-001"), baseAip("aip-002")]}
      />
    );

    act(() => {
      latestRealtimeArgs?.onRunEvent?.({
        eventType: "UPDATE",
        run: {
          id: "run-001",
          aip_id: "aip-001",
          stage: "extract",
          status: "running",
          error_message: null,
          overall_progress_pct: 42,
          stage_progress_pct: 75,
          progress_message: "Extracting...",
          progress_updated_at: "2026-02-21T00:01:00.000Z",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("aip-card-aip-001")).toHaveTextContent("processing");
      expect(screen.getByTestId("aip-card-aip-001")).toHaveTextContent("42");
    });
    expect(screen.getByTestId("aip-card-aip-002")).toHaveTextContent("idle");
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("clears processing and refreshes once on terminal run statuses", async () => {
    render(<AipManagementView scope="barangay" records={[baseAip("aip-001")]} />);

    act(() => {
      latestRealtimeArgs?.onRunEvent?.({
        eventType: "UPDATE",
        run: {
          id: "run-002",
          aip_id: "aip-001",
          stage: "validate",
          status: "running",
          error_message: null,
          overall_progress_pct: 60,
          stage_progress_pct: 60,
          progress_message: "Validating...",
          progress_updated_at: "2026-02-21T00:02:00.000Z",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("aip-card-aip-001")).toHaveTextContent("processing");
    });

    act(() => {
      latestRealtimeArgs?.onRunEvent?.({
        eventType: "UPDATE",
        run: {
          id: "run-002",
          aip_id: "aip-001",
          stage: "categorize",
          status: "succeeded",
          error_message: null,
          overall_progress_pct: 100,
          stage_progress_pct: 100,
          progress_message: null,
          progress_updated_at: "2026-02-21T00:03:00.000Z",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("aip-card-aip-001")).toHaveTextContent("idle");
    });

    act(() => {
      latestRealtimeArgs?.onRunEvent?.({
        eventType: "UPDATE",
        run: {
          id: "run-002",
          aip_id: "aip-001",
          stage: "categorize",
          status: "succeeded",
          error_message: null,
          overall_progress_pct: 100,
          stage_progress_pct: 100,
          progress_message: null,
          progress_updated_at: "2026-02-21T00:03:01.000Z",
        },
      });
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
