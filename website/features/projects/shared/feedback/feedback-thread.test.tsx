import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackThread } from "./feedback-thread";

const mockListProjectFeedback = vi.fn();
const mockCreateProjectFeedback = vi.fn();
const mockCreateProjectFeedbackReply = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => "/projects/infrastructure/proj-1",
  useSearchParams: () => ({
    toString: () => "",
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  }),
}));

vi.mock("./feedback.api", async () => {
  const actual = await vi.importActual<typeof import("./feedback.api")>("./feedback.api");
  return {
    ...actual,
    listProjectFeedback: (...args: unknown[]) => mockListProjectFeedback(...args),
    createProjectFeedback: (...args: unknown[]) => mockCreateProjectFeedback(...args),
    createProjectFeedbackReply: (...args: unknown[]) => mockCreateProjectFeedbackReply(...args),
  };
});

describe("FeedbackThread auth status loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListProjectFeedback.mockResolvedValue({ items: [] });
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "citizen-1" },
      },
      error: null,
    });
    mockOnAuthStateChange.mockImplementation(
      (callback: (event: string, session: { user: { id: string } } | null) => void) => {
        callback("INITIAL_SESSION", { user: { id: "citizen-1" } });
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches /profile/status once when INITIAL_SESSION is emitted", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, isComplete: true }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackThread projectId="proj-1" />);

    await waitFor(() => {
      expect(mockListProjectFeedback).toHaveBeenCalledWith("proj-1");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/profile/status", {
      method: "GET",
      cache: "no-store",
    });
  });
});
