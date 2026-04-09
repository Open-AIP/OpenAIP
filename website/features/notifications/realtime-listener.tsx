"use client";

import { useEffect, useRef } from "react";
import type { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import {
  subscribeToNotificationsRealtime,
  type NotificationRealtimeEvent,
} from "@/features/notifications/realtime-subscription-manager";

export type { NotificationRealtimeEvent } from "@/features/notifications/realtime-subscription-manager";

type Props = {
  userId: string | null;
  onEvent?: (event: NotificationRealtimeEvent) => void;
  onStatusChange?: (status: REALTIME_SUBSCRIBE_STATES) => void;
};

export default function NotificationsRealtimeListener({ userId, onEvent, onStatusChange }: Props) {
  const onEventRef = useRef(onEvent);
  const onStatusRef = useRef(onStatusChange);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onStatusRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!userId) return;

    return subscribeToNotificationsRealtime({
      userId,
      onEvent: (event) => {
        onEventRef.current?.(event);
      },
      onStatusChange: (status) => {
        onStatusRef.current?.(status);
      },
    });
  }, [userId]);

  return null;
}
