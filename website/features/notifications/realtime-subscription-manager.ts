"use client";

import type {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

export type NotificationRealtimePayload = {
  id: string;
  recipient_user_id: string;
  recipient_role: string | null;
  scope_type: string | null;
  event_type: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
  read_at: string | null;
  title: string;
  message: string;
};

export type NotificationRealtimeEvent = {
  eventType: "INSERT" | "UPDATE";
  row: NotificationRealtimePayload;
};

type ListenerCallbacks = {
  onEvent?: (event: NotificationRealtimeEvent) => void;
  onStatusChange?: (status: REALTIME_SUBSCRIBE_STATES) => void;
};

type SubscriptionOptions = {
  userId: string;
  onEvent?: (event: NotificationRealtimeEvent) => void;
  onStatusChange?: (status: REALTIME_SUBSCRIBE_STATES) => void;
};

type ChannelRegistryEntry = {
  channel: RealtimeChannel;
  listeners: Map<number, ListenerCallbacks>;
  teardownTimer: ReturnType<typeof globalThis.setTimeout> | null;
  lastStatus: REALTIME_SUBSCRIBE_STATES | null;
};

const CHANNEL_TEARDOWN_DELAY_MS = 250;
const channelRegistry = new Map<string, ChannelRegistryEntry>();
let nextListenerId = 1;

function asNotificationPayload(value: unknown): NotificationRealtimePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : null;
  const recipientUserId = typeof row.recipient_user_id === "string" ? row.recipient_user_id : null;
  if (!id || !recipientUserId) return null;

  return {
    id,
    recipient_user_id: recipientUserId,
    recipient_role: typeof row.recipient_role === "string" ? row.recipient_role : null,
    scope_type: typeof row.scope_type === "string" ? row.scope_type : null,
    event_type: typeof row.event_type === "string" ? row.event_type : null,
    action_url: typeof row.action_url === "string" ? row.action_url : null,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    read_at: typeof row.read_at === "string" ? row.read_at : null,
    title: typeof row.title === "string" ? row.title : "",
    message: typeof row.message === "string" ? row.message : "",
  };
}

function notifyEvent(userId: string, event: NotificationRealtimeEvent) {
  const entry = channelRegistry.get(userId);
  if (!entry) return;
  for (const callbacks of entry.listeners.values()) {
    callbacks.onEvent?.(event);
  }
}

function notifyStatus(userId: string, status: REALTIME_SUBSCRIBE_STATES) {
  const entry = channelRegistry.get(userId);
  if (!entry) return;
  entry.lastStatus = status;
  for (const callbacks of entry.listeners.values()) {
    callbacks.onStatusChange?.(status);
  }
}

function handlePayload(
  userId: string,
  eventType: "INSERT" | "UPDATE",
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
) {
  const row = asNotificationPayload(payload.new);
  if (!row) return;
  notifyEvent(userId, { eventType, row });
}

function scheduleChannelTeardown(userId: string, entry: ChannelRegistryEntry) {
  entry.teardownTimer = globalThis.setTimeout(() => {
    const current = channelRegistry.get(userId);
    if (current !== entry) return;
    if (current.listeners.size > 0) return;

    channelRegistry.delete(userId);
    void supabaseBrowser().removeChannel(current.channel);
  }, CHANNEL_TEARDOWN_DELAY_MS);
}

function ensureChannelEntry(userId: string): ChannelRegistryEntry {
  const existing = channelRegistry.get(userId);
  if (existing) {
    if (existing.teardownTimer) {
      globalThis.clearTimeout(existing.teardownTimer);
      existing.teardownTimer = null;
    }
    return existing;
  }

  const supabase = supabaseBrowser();
  const channel = supabase.channel(`notifications:${userId}`);
  const entry: ChannelRegistryEntry = {
    channel,
    listeners: new Map(),
    teardownTimer: null,
    lastStatus: null,
  };

  channelRegistry.set(userId, entry);

  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        handlePayload(userId, "INSERT", payload);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `recipient_user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        handlePayload(userId, "UPDATE", payload);
      }
    )
    .subscribe((status) => {
      notifyStatus(userId, status);
    });

  return entry;
}

export function subscribeToNotificationsRealtime({
  userId,
  onEvent,
  onStatusChange,
}: SubscriptionOptions): () => void {
  const entry = ensureChannelEntry(userId);
  const listenerId = nextListenerId++;

  entry.listeners.set(listenerId, { onEvent, onStatusChange });
  if (entry.lastStatus) {
    onStatusChange?.(entry.lastStatus);
  }

  return () => {
    const current = channelRegistry.get(userId);
    if (!current) return;

    current.listeners.delete(listenerId);
    if (current.listeners.size > 0 || current.teardownTimer) return;
    scheduleChannelTeardown(userId, current);
  };
}

export function __resetNotificationsRealtimeRegistryForTests() {
  for (const [userId, entry] of channelRegistry.entries()) {
    if (entry.teardownTimer) {
      globalThis.clearTimeout(entry.teardownTimer);
      entry.teardownTimer = null;
    }
    channelRegistry.delete(userId);
    void supabaseBrowser().removeChannel(entry.channel);
  }
  nextListenerId = 1;
}
