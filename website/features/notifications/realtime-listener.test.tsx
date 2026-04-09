import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_SUBSCRIBE_STATES,
  type RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import NotificationsRealtimeListener from "@/features/notifications/realtime-listener";
import {
  __resetNotificationsRealtimeRegistryForTests,
  type NotificationRealtimeEvent,
} from "@/features/notifications/realtime-subscription-manager";

type PostgresHandler = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
type StatusHandler = (status: REALTIME_SUBSCRIBE_STATES) => void;

const channelState = vi.hoisted(() => ({
  insertHandler: undefined as PostgresHandler | undefined,
  updateHandler: undefined as PostgresHandler | undefined,
  statusHandler: undefined as StatusHandler | undefined,
}));

const mockChannel = vi.hoisted(() => ({
  on: vi.fn(),
  subscribe: vi.fn(),
}));

const mockSupabase = vi.hoisted(() => ({
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => mockSupabase,
}));

function emitInsert(id: string, recipientUserId: string) {
  const payload: RealtimePostgresChangesPayload<Record<string, unknown>> = {
    eventType: "INSERT",
    schema: "public",
    table: "notifications",
    commit_timestamp: "2026-04-09T00:00:00.000Z",
    errors: [],
    old: {},
    new: {
      id,
      recipient_user_id: recipientUserId,
      recipient_role: "citizen",
      scope_type: "citizen",
      event_type: "FEEDBACK_CREATED",
      action_url: "/notifications/live",
      metadata: { source: "realtime" },
      created_at: "2026-04-09T00:00:00.000Z",
      read_at: null,
      title: "Realtime",
      message: "Incoming update",
    },
  };

  act(() => {
    channelState.insertHandler?.(payload);
  });
}

describe("NotificationsRealtimeListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    channelState.insertHandler = undefined;
    channelState.updateHandler = undefined;
    channelState.statusHandler = undefined;

    mockChannel.on.mockImplementation((eventType: string, filter: { event?: string }, callback: unknown) => {
      if (eventType === "postgres_changes" && filter.event === "INSERT") {
        channelState.insertHandler = callback as PostgresHandler;
      }
      if (eventType === "postgres_changes" && filter.event === "UPDATE") {
        channelState.updateHandler = callback as PostgresHandler;
      }
      return mockChannel;
    });
    mockChannel.subscribe.mockImplementation((callback: unknown) => {
      channelState.statusHandler = callback as StatusHandler;
      return mockChannel;
    });

    mockSupabase.channel.mockReturnValue(mockChannel);
    mockSupabase.removeChannel.mockResolvedValue("ok");
  });

  afterEach(() => {
    __resetNotificationsRealtimeRegistryForTests();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("uses a single channel per user and fans out status/events to both listeners", () => {
    const firstEvents: NotificationRealtimeEvent[] = [];
    const secondEvents: NotificationRealtimeEvent[] = [];
    const firstStatuses: REALTIME_SUBSCRIBE_STATES[] = [];
    const secondStatuses: REALTIME_SUBSCRIBE_STATES[] = [];

    render(
      <>
        <NotificationsRealtimeListener
          userId="user-123"
          onEvent={(event) => {
            firstEvents.push(event);
          }}
          onStatusChange={(status) => {
            firstStatuses.push(status);
          }}
        />
        <NotificationsRealtimeListener
          userId="user-123"
          onEvent={(event) => {
            secondEvents.push(event);
          }}
          onStatusChange={(status) => {
            secondStatuses.push(status);
          }}
        />
      </>
    );

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);

    act(() => {
      channelState.statusHandler?.(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
    });
    emitInsert("notif-1", "user-123");

    expect(firstStatuses).toEqual([REALTIME_SUBSCRIBE_STATES.SUBSCRIBED]);
    expect(secondStatuses).toEqual([REALTIME_SUBSCRIBE_STATES.SUBSCRIBED]);
    expect(firstEvents).toHaveLength(1);
    expect(secondEvents).toHaveLength(1);
    expect(firstEvents[0]?.row.id).toBe("notif-1");
    expect(secondEvents[0]?.row.id).toBe("notif-1");
  });

  it("replays latest status to later listeners without creating another channel", () => {
    const firstStatuses: REALTIME_SUBSCRIBE_STATES[] = [];
    const secondStatuses: REALTIME_SUBSCRIBE_STATES[] = [];

    render(
      <NotificationsRealtimeListener
        userId="user-123"
        onStatusChange={(status) => {
          firstStatuses.push(status);
        }}
      />
    );

    act(() => {
      channelState.statusHandler?.(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
    });

    render(
      <NotificationsRealtimeListener
        userId="user-123"
        onStatusChange={(status) => {
          secondStatuses.push(status);
        }}
      />
    );

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);
    expect(firstStatuses).toEqual([REALTIME_SUBSCRIBE_STATES.SUBSCRIBED]);
    expect(secondStatuses).toEqual([REALTIME_SUBSCRIBE_STATES.SUBSCRIBED]);
  });

  it("removes the shared channel only after the last listener unmounts", () => {
    const first = render(<NotificationsRealtimeListener userId="user-123" />);
    const second = render(<NotificationsRealtimeListener userId="user-123" />);

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    expect(mockSupabase.removeChannel).not.toHaveBeenCalled();

    first.unmount();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockSupabase.removeChannel).not.toHaveBeenCalled();

    second.unmount();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
