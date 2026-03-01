import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCitizenChatbot } from "./hooks/use-citizen-chatbot";

const mockReplace = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

const mockRepo = {
  listSessions: vi.fn(),
  getSession: vi.fn(),
  createSession: vi.fn(),
  renameSession: vi.fn(),
  deleteSession: vi.fn(),
  listMessages: vi.fn(),
  appendUserMessage: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/ai-assistant",
  useRouter: () => ({
    replace: (...args: unknown[]) => mockReplace(...args),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  }),
}));

vi.mock("@/lib/repos/citizen-chat/repo", () => ({
  getCitizenChatRepo: () => mockRepo,
}));

describe("useCitizenChatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
    mockRepo.listSessions.mockResolvedValue([]);
    mockRepo.listMessages.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lands authenticated users in a new-chat state even when sessions exist", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "citizen-1" } },
      error: null,
    });
    mockRepo.listSessions.mockResolvedValue([
      {
        id: "session-1",
        userId: "citizen-1",
        title: "Budget Q&A",
        context: {},
        lastMessageAt: "2026-03-01T00:00:00.000Z",
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
    ]);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, isComplete: true }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCitizenChatbot());

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
    });

    expect(result.current.composerMode).toBe("send");
    expect(result.current.activeSessionId).toBeNull();
    expect(result.current.sessionItems).toHaveLength(1);
    expect(mockRepo.listSessions).toHaveBeenCalledWith("citizen-1");
  });

  it("uses sign-in composer mode for anonymous users and opens auth modal query", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useCitizenChatbot());

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
    });

    expect(result.current.composerMode).toBe("sign_in");
    expect(result.current.sessionItems).toHaveLength(0);
    expect(mockRepo.listSessions).not.toHaveBeenCalled();

    act(() => {
      result.current.handleComposerPrimaryAction();
    });

    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("auth=login"), { scroll: false });
  });

  it("uses complete-profile composer mode for signed-in incomplete profiles", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "citizen-2" } },
      error: null,
    });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, isComplete: false }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCitizenChatbot());

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
    });

    expect(result.current.composerMode).toBe("complete_profile");

    act(() => {
      result.current.handleComposerPrimaryAction();
    });

    const href = String(mockReplace.mock.calls.at(-1)?.[0] ?? "");
    expect(href).toContain("completeProfile=1");
    expect(href).not.toContain("auth=login");
  });
});
