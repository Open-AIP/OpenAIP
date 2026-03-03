import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabaseServer = vi.fn();
const mockEnforceCsrfProtection = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

vi.mock("@/lib/security/csrf", () => ({
  enforceCsrfProtection: (...args: unknown[]) => mockEnforceCsrfProtection(...args),
}));

import { GET as listNotifications } from "@/app/api/notifications/route";
import { GET as openTrackedNotification } from "@/app/api/notifications/open/route";
import { POST as markAllRead } from "@/app/api/notifications/read-all/route";
import { PATCH as markOneRead } from "@/app/api/notifications/[notificationId]/read/route";

describe("notifications api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnforceCsrfProtection.mockReturnValue({ ok: true });
  });

  it("requires auth for notifications list", async () => {
    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: "Unauthorized." },
        }),
      },
    });

    const response = await listNotifications(new Request("http://localhost/api/notifications"));
    expect(response.status).toBe(401);
  });

  it("marks only current user's rows as read in mark-all endpoint", async () => {
    const eqRecipient = vi.fn(() => ({
      is: async () => ({ error: null }),
    }));
    const update = vi.fn(() => ({
      eq: eqRecipient,
    }));

    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: () => ({
        update,
      }),
    });

    const response = await markAllRead(
      new Request("http://localhost/api/notifications/read-all", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(eqRecipient).toHaveBeenCalledWith("recipient_user_id", "user-123");
  });

  it("marks a single notification row for the current user only", async () => {
    const eqUser = vi.fn(async () => ({ error: null }));
    const eqNotificationId = vi.fn(() => ({
      eq: eqUser,
    }));
    const update = vi.fn(() => ({
      eq: eqNotificationId,
    }));

    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-999" } },
          error: null,
        }),
      },
      from: () => ({
        update,
      }),
    });

    const response = await markOneRead(
      new Request("http://localhost/api/notifications/abc/read", {
        method: "PATCH",
        headers: {
          origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ notificationId: "notif-abc" }) }
    );

    expect(response.status).toBe(200);
    expect(eqNotificationId).toHaveBeenCalledWith("id", "notif-abc");
    expect(eqUser).toHaveBeenCalledWith("recipient_user_id", "user-999");
  });

  it("tracked-open marks by notification id for authenticated user and redirects", async () => {
    const eqUser = vi.fn(async () => ({ error: null }));
    const eqNotificationId = vi.fn(() => ({
      eq: eqUser,
    }));
    const update = vi.fn(() => ({
      eq: eqNotificationId,
    }));

    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: () => ({
        update,
      }),
    });

    const response = await openTrackedNotification(
      new Request(
        "http://localhost/api/notifications/open?next=%2Fcity%2Faips%2Faip-1&notificationId=notif-1"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/city/aips/aip-1");
    expect(eqNotificationId).toHaveBeenCalledWith("id", "notif-1");
    expect(eqUser).toHaveBeenCalledWith("recipient_user_id", "user-1");
  });

  it("tracked-open marks by dedupe key for authenticated user and redirects", async () => {
    const isUnread = vi.fn(async () => ({ error: null }));
    const eqUser = vi.fn(() => ({
      is: isUnread,
    }));
    const eqDedupe = vi.fn(() => ({
      eq: eqUser,
    }));
    const update = vi.fn(() => ({
      eq: eqDedupe,
    }));

    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-2" } },
          error: null,
        }),
      },
      from: () => ({
        update,
      }),
    });

    const response = await openTrackedNotification(
      new Request(
        "http://localhost/api/notifications/open?next=%2Faips%2Faip-2&dedupe=AIP_PUBLISHED%3Aaip%3Aaip-2%3Adraft-%3Epublished"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/aips/aip-2");
    expect(eqDedupe).toHaveBeenCalledWith(
      "dedupe_key",
      "AIP_PUBLISHED:aip:aip-2:draft->published"
    );
    expect(eqUser).toHaveBeenCalledWith("recipient_user_id", "user-2");
    expect(isUnread).toHaveBeenCalledWith("read_at", null);
  });

  it("tracked-open redirects without marking when user is unauthenticated", async () => {
    const fromSpy = vi.fn();

    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: "Unauthorized." },
        }),
      },
      from: fromSpy,
    });

    const response = await openTrackedNotification(
      new Request(
        "http://localhost/api/notifications/open?next=%2Fnotifications&notificationId=notif-9"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/notifications");
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it("tracked-open falls back to root for unsafe next", async () => {
    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: "Unauthorized." },
        }),
      },
      from: vi.fn(),
    });

    const response = await openTrackedNotification(
      new Request("http://localhost/api/notifications/open?next=https%3A%2F%2Fevil.com")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});
