import { NextResponse } from "next/server";
import { isSafeInternalPath } from "@/lib/notifications/open-link";
import { supabaseServer } from "@/lib/supabase/server";

function toSafeRedirectPath(value: string | null): string {
  if (!isSafeInternalPath(value)) return "/";
  return value.trim();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = toSafeRedirectPath(requestUrl.searchParams.get("next"));
  const notificationId = requestUrl.searchParams.get("notificationId")?.trim() ?? "";
  const dedupe = requestUrl.searchParams.get("dedupe")?.trim() ?? "";

  try {
    const client = await supabaseServer();
    const { data: authData, error: authError } = await client.auth.getUser();
    const userId = authError ? null : authData.user?.id ?? null;

    if (userId) {
      if (notificationId) {
        const { error } = await client
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", notificationId)
          .eq("recipient_user_id", userId);
        if (error) {
          console.error("[NOTIFICATIONS][OPEN_MARK_READ_FAILED]", {
            strategy: "notification_id",
            notificationId,
            userId,
            message: error.message,
          });
        }
      } else if (dedupe) {
        const { error } = await client
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("dedupe_key", dedupe)
          .eq("recipient_user_id", userId)
          .is("read_at", null);
        if (error) {
          console.error("[NOTIFICATIONS][OPEN_MARK_READ_FAILED]", {
            strategy: "dedupe",
            dedupe,
            userId,
            message: error.message,
          });
        }
      }
    }
  } catch (error) {
    console.error("[NOTIFICATIONS][OPEN_ROUTE_FAILED]", {
      message: error instanceof Error ? error.message : String(error),
      notificationId: notificationId || null,
      dedupe: dedupe || null,
    });
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin), 307);
}
