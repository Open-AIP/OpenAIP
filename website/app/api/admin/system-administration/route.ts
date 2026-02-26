import { NextResponse } from "next/server";
import { writeActivityLog } from "@/lib/audit/activity-log";
import { getActivityScopeFromActor } from "@/lib/auth/actor-scope-guards";
import { getActorContext } from "@/lib/domain/get-actor-context";
import type {
  NotificationSettings,
  SecuritySettings,
  SystemBannerDraft,
} from "@/lib/repos/system-administration/types";
import {
  getTypedAppSetting,
  isSettingsStoreUnavailableError,
  setTypedAppSetting,
} from "@/lib/settings/app-settings";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ActionPayload =
  | {
      action: "update_security_settings";
      payload: {
        next: SecuritySettings;
        meta?: { performedBy?: string | null; performedAt?: string; reason?: string | null };
      };
    }
  | {
      action: "update_notification_settings";
      payload: {
        next: NotificationSettings;
        meta?: { performedBy?: string | null; performedAt?: string; reason?: string | null };
      };
    }
  | {
      action: "publish_system_banner";
      payload: {
        draft: SystemBannerDraft;
        meta?: { performedBy?: string | null; performedAt?: string; reason?: string | null };
      };
    };

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
}

async function listSystemAuditLogs() {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("activity_log")
    .select(
      "id,actor_id,actor_role,action,entity_table,entity_id,region_id,province_id,city_id,municipality_id,barangay_id,metadata,created_at"
    )
    .in("action", [
      "security_settings_updated",
      "notification_settings_updated",
      "system_banner_published",
    ])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function GET() {
  const actor = await getActorContext();
  if (!actor || actor.role !== "admin") return unauthorized();

  try {
    const [securitySettings, notificationSettings, systemBannerDraft, auditLogs] =
      await Promise.all([
        getTypedAppSetting("system.security_settings"),
        getTypedAppSetting("system.notification_settings"),
        getTypedAppSetting("system.banner_draft"),
        listSystemAuditLogs(),
      ]);

    return NextResponse.json(
      {
        securitySettings,
        notificationSettings,
        systemBannerDraft,
        auditLogs,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load system administration data.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await getActorContext();
  if (!actor || actor.role !== "admin") return unauthorized();

  try {
    const body = (await request.json()) as ActionPayload;
    const activityScope = getActivityScopeFromActor(actor);

    if (body.action === "update_security_settings") {
      const before = await getTypedAppSetting("system.security_settings");
      const next = await setTypedAppSetting("system.security_settings", body.payload.next);
      const performedBy = body.payload.meta?.performedBy ?? "Admin";
      const performedAt = body.payload.meta?.performedAt ?? new Date().toISOString();

      await writeActivityLog({
        action: "security_settings_updated",
        metadata: {
          before,
          after: next,
          reason: body.payload.meta?.reason ?? null,
          actor_name: performedBy,
        },
        scope: activityScope,
      });

      return NextResponse.json(
        {
          securitySettings: next,
          meta: {
            performedBy,
            performedAt,
          },
        },
        { status: 200 }
      );
    }

    if (body.action === "update_notification_settings") {
      const before = await getTypedAppSetting("system.notification_settings");
      const next = await setTypedAppSetting("system.notification_settings", body.payload.next);
      const performedBy = body.payload.meta?.performedBy ?? "Admin";
      const performedAt = body.payload.meta?.performedAt ?? new Date().toISOString();

      await writeActivityLog({
        action: "notification_settings_updated",
        metadata: {
          before,
          after: next,
          reason: body.payload.meta?.reason ?? null,
          actor_name: performedBy,
        },
        scope: activityScope,
      });

      return NextResponse.json(
        {
          notificationSettings: next,
          meta: {
            performedBy,
            performedAt,
          },
        },
        { status: 200 }
      );
    }

    if (body.action === "publish_system_banner") {
      const before = await getTypedAppSetting("system.banner_draft");
      const next = await setTypedAppSetting("system.banner_draft", body.payload.draft);
      const performedBy = body.payload.meta?.performedBy ?? "Admin";
      const publishedAt = body.payload.meta?.performedAt ?? new Date().toISOString();

      await writeActivityLog({
        action: "system_banner_published",
        metadata: {
          before,
          after: {
            ...next,
            publishedAt,
          },
          reason: body.payload.meta?.reason ?? null,
          actor_name: performedBy,
        },
        scope: activityScope,
      });

      return NextResponse.json(
        {
          systemBanner: {
            ...next,
            publishedAt,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
  } catch (error) {
    if (isSettingsStoreUnavailableError(error)) {
      const message = error instanceof Error ? error.message : "Settings store unavailable.";
      return NextResponse.json({ message }, { status: 503 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to update system administration.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
