import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCitizenAccount } from "./use-citizen-account";

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  }),
}));

function createProfilePayload() {
  return {
    ok: true,
    fullName: "Juan Dela Cruz",
    email: "juan@example.com",
    firstName: "Juan",
    lastName: "Dela Cruz",
    barangay: "Barangay Uno",
    city: "Cabuyao",
    province: "Laguna",
  };
}

describe("useCitizenAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores INITIAL_SESSION callback and fetches profile once on mount", async () => {
    const unsubscribe = vi.fn();
    const fetchMock = vi.fn<typeof fetch>();

    mockGetUser.mockResolvedValue({
      data: { user: { id: "citizen-1" } },
      error: null,
    });
    mockOnAuthStateChange.mockImplementation(
      (callback: (event: string, session: { user: { id: string } } | null) => void) => {
        callback("INITIAL_SESSION", { user: { id: "citizen-1" } });
        return {
          data: {
            subscription: {
              unsubscribe,
            },
          },
        };
      }
    );
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => createProfilePayload(),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useCitizenAccount());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent refresh calls", async () => {
    const fetchMock = vi.fn<typeof fetch>();

    mockGetUser.mockResolvedValue({
      data: { user: { id: "citizen-1" } },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => createProfilePayload(),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCitizenAccount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockClear();
    mockGetUser.mockClear();

    await act(async () => {
      await Promise.all([result.current.refresh(), result.current.refresh()]);
    });

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
