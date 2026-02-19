import type { ActivityLogRow } from "@/lib/contracts/databasev2";
import {
  SYSTEM_ADMIN_ACTIVITY_LOGS,
  SYSTEM_ADMIN_BANNER_DRAFT,
  SYSTEM_ADMIN_NOTIFICATION_SETTINGS,
  SYSTEM_ADMIN_SECURITY_SETTINGS,
} from "@/mocks/fixtures/admin/system-administration/systemAdministration.mock";
import type {
  NotificationSettings,
  SecuritySettings,
  SystemAdministrationRepo,
  SystemAdministrationUpdateMeta,
  SystemBanner,
  SystemBannerDraft,
} from "./types";

type SystemAdministrationStore = {
  security: SecuritySettings;
  notifications: NotificationSettings;
  bannerDraft: SystemBannerDraft;
  bannerPublished: SystemBanner | null;
  activity: ActivityLogRow[];
};

let idCounter = 0;

const nowIso = () => new Date().toISOString();

const createId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

const cloneSettings = (): SystemAdministrationStore => ({
  security: {
    ...SYSTEM_ADMIN_SECURITY_SETTINGS,
    passwordPolicy: { ...SYSTEM_ADMIN_SECURITY_SETTINGS.passwordPolicy },
    sessionTimeout: { ...SYSTEM_ADMIN_SECURITY_SETTINGS.sessionTimeout },
    loginAttemptLimits: { ...SYSTEM_ADMIN_SECURITY_SETTINGS.loginAttemptLimits },
  },
  notifications: { ...SYSTEM_ADMIN_NOTIFICATION_SETTINGS },
  bannerDraft: { ...SYSTEM_ADMIN_BANNER_DRAFT },
  bannerPublished: null,
  activity: SYSTEM_ADMIN_ACTIVITY_LOGS.map((row) => ({ ...row })),
});

const store: SystemAdministrationStore = cloneSettings();

const appendActivity = (input: ActivityLogRow) => {
  store.activity = [...store.activity, input];
};

const resolveActorName = (meta?: SystemAdministrationUpdateMeta) =>
  meta?.performedBy ?? "Admin Maria Rodriguez";

const resolvePerformedAt = (meta?: SystemAdministrationUpdateMeta) => meta?.performedAt ?? nowIso();

const createAuditEntry = (
  action: string,
  metadata: Record<string, unknown>,
  meta?: SystemAdministrationUpdateMeta
): ActivityLogRow => ({
  id: createId("activity"),
  actor_id: "admin_001",
  actor_role: "admin",
  action,
  entity_table: null,
  entity_id: null,
  region_id: null,
  province_id: null,
  city_id: null,
  municipality_id: null,
  barangay_id: null,
  metadata: {
    ...metadata,
    actor_name: resolveActorName(meta),
  },
  created_at: resolvePerformedAt(meta),
});

export function createMockSystemAdministrationRepo(): SystemAdministrationRepo {
  return {
    async getSecuritySettings() {
      return { ...store.security };
    },
    async updateSecuritySettings(next, meta) {
      const before = store.security;
      store.security = {
        ...next,
        passwordPolicy: { ...next.passwordPolicy },
        sessionTimeout: { ...next.sessionTimeout },
        loginAttemptLimits: { ...next.loginAttemptLimits },
      };
      appendActivity(
        createAuditEntry(
          "security_settings_updated",
          { before, after: store.security, reason: meta?.reason ?? null },
          meta
        )
      );
      return { ...store.security };
    },
    async getNotificationSettings() {
      return { ...store.notifications };
    },
    async updateNotificationSettings(next, meta) {
      const before = store.notifications;
      store.notifications = { ...next };
      appendActivity(
        createAuditEntry(
          "notification_settings_updated",
          { before, after: store.notifications, reason: meta?.reason ?? null },
          meta
        )
      );
      return { ...store.notifications };
    },
    async getSystemBannerDraft() {
      return { ...store.bannerDraft };
    },
    async publishSystemBanner(draft, meta) {
      const before = store.bannerDraft;
      const published: SystemBanner = {
        ...draft,
        publishedAt: resolvePerformedAt(meta),
      };
      store.bannerDraft = { ...draft };
      store.bannerPublished = published;
      appendActivity(
        createAuditEntry(
          "system_banner_published",
          { before, after: published, reason: meta?.reason ?? null },
          meta
        )
      );
      return published;
    },
    async listAuditLogs() {
      return store.activity.map((row) => ({ ...row }));
    },
  };
}

