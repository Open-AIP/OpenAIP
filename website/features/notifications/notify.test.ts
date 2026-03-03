import { beforeEach, describe, expect, it, vi } from "vitest";

type MockRecipient = {
  userId: string;
  role: "admin" | "city_official" | "barangay_official" | "citizen";
  email: string | null;
  scopeType: "admin" | "city" | "barangay" | "citizen";
};

const mockGetAdminRecipients = vi.fn<() => Promise<MockRecipient[]>>();
const mockGetBarangayOfficialRecipients = vi.fn<() => Promise<MockRecipient[]>>();
const mockGetCitizenRecipientsForBarangay = vi.fn<() => Promise<MockRecipient[]>>();
const mockGetUserById = vi.fn();
const notificationUpserts: Array<{ rows: Array<Record<string, unknown>>; options: unknown }> = [];
const emailUpserts: Array<{ rows: Array<Record<string, unknown>>; options: unknown }> = [];
let preferenceRows: Array<{
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
}> = [];

vi.mock("@/lib/notifications/recipients", () => ({
  getAdminRecipients: () => mockGetAdminRecipients(),
  getBarangayOfficialRecipients: () => mockGetBarangayOfficialRecipients(),
  getCityOfficialRecipients: vi.fn(async () => []),
  getCitizenRecipientsForBarangay: () => mockGetCitizenRecipientsForBarangay(),
  getCitizenRecipientsForCity: vi.fn(async () => []),
  getRecipientByUserId: vi.fn(async () => null),
  resolveAipScope: vi.fn(async () => null),
  resolveFeedbackContext: vi.fn(async () => null),
  resolveProjectScope: vi.fn(async () => null),
  resolveProjectUpdateContext: vi.fn(async () => null),
  mergeRecipients: (...groups: Array<MockRecipient[]>) => {
    const merged = groups.flat();
    const seen = new Set<string>();
    return merged.filter((recipient) => {
      if (seen.has(recipient.userId)) return false;
      seen.add(recipient.userId);
      return true;
    });
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "notification_preferences") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({ data: preferenceRows, error: null }),
            }),
          }),
        };
      }

      if (table === "notifications") {
        return {
          upsert: async (rows: Array<Record<string, unknown>>, options: unknown) => {
            notificationUpserts.push({ rows, options });
            return { error: null };
          },
        };
      }

      if (table === "email_outbox") {
        return {
          upsert: async (rows: Array<Record<string, unknown>>, options: unknown) => {
            emailUpserts.push({ rows, options });
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table in notification test mock: ${table}`);
    },
    auth: {
      admin: {
        getUserById: (...args: unknown[]) => mockGetUserById(...args),
      },
    },
  }),
}));

import { notify } from "@/lib/notifications/notify";

describe("notify()", () => {
  beforeEach(() => {
    preferenceRows = [];
    notificationUpserts.length = 0;
    emailUpserts.length = 0;
    mockGetUserById.mockReset();
    mockGetUserById.mockResolvedValue({
      data: { user: { email: "fallback@example.com" } },
      error: null,
    });

    mockGetAdminRecipients.mockReset();
    mockGetAdminRecipients.mockResolvedValue([
      {
        userId: "admin-1",
        role: "admin",
        email: "admin1@example.com",
        scopeType: "admin",
      },
      {
        userId: "admin-2",
        role: "admin",
        email: "admin2@example.com",
        scopeType: "admin",
      },
    ]);
    mockGetBarangayOfficialRecipients.mockReset();
    mockGetBarangayOfficialRecipients.mockResolvedValue([]);
    mockGetCitizenRecipientsForBarangay.mockReset();
    mockGetCitizenRecipientsForBarangay.mockResolvedValue([]);
  });

  it("inserts notifications and outbox rows for multiple recipients", async () => {
    const result = await notify({
      eventType: "OUTBOX_FAILURE_THRESHOLD_REACHED",
      scopeType: "admin",
      entityType: "system",
      entityId: null,
      dedupeBucket: "2026-03-03T05",
    });

    expect(result.recipientCount).toBe(2);
    expect(notificationUpserts).toHaveLength(1);
    expect(notificationUpserts[0].rows).toHaveLength(2);
    expect(emailUpserts).toHaveLength(1);
    expect(emailUpserts[0].rows).toHaveLength(2);
    expect(notificationUpserts[0].rows[0].dedupe_key).toBe(
      "OUTBOX_FAILURE_THRESHOLD_REACHED:system:none:2026-03-03T05"
    );
    expect(emailUpserts[0].rows[0].payload).toMatchObject({
      notification_ref: "OUTBOX_FAILURE_THRESHOLD_REACHED:system:none:2026-03-03T05",
    });
  });

  it("respects preference rows and keeps missing rows enabled by default", async () => {
    preferenceRows = [
      { user_id: "admin-1", in_app_enabled: false, email_enabled: true },
      { user_id: "admin-2", in_app_enabled: true, email_enabled: false },
    ];

    const result = await notify({
      eventType: "OUTBOX_FAILURE_THRESHOLD_REACHED",
      scopeType: "admin",
      entityType: "system",
      entityId: null,
      dedupeBucket: "2026-03-03T06",
    });

    expect(result.recipientCount).toBe(2);
    expect(notificationUpserts).toHaveLength(1);
    expect(notificationUpserts[0].rows).toHaveLength(1);
    expect(notificationUpserts[0].rows[0].recipient_user_id).toBe("admin-2");
    expect(emailUpserts).toHaveLength(1);
    expect(emailUpserts[0].rows).toHaveLength(1);
    expect(emailUpserts[0].rows[0].recipient_user_id).toBe("admin-1");
  });

  it("uses idempotent conflict targets for repeat emissions", async () => {
    await notify({
      eventType: "OUTBOX_FAILURE_THRESHOLD_REACHED",
      scopeType: "admin",
      entityType: "system",
      entityId: null,
      dedupeBucket: "2026-03-03T07",
    });
    await notify({
      eventType: "OUTBOX_FAILURE_THRESHOLD_REACHED",
      scopeType: "admin",
      entityType: "system",
      entityId: null,
      dedupeBucket: "2026-03-03T07",
    });

    expect(notificationUpserts).toHaveLength(2);
    expect(notificationUpserts[0].options).toEqual({
      onConflict: "recipient_user_id,dedupe_key",
      ignoreDuplicates: true,
    });
    expect(emailUpserts).toHaveLength(2);
    expect(emailUpserts[0].options).toEqual({
      onConflict: "to_email,dedupe_key",
      ignoreDuplicates: true,
    });
    expect(notificationUpserts[0].rows[0].dedupe_key).toBe(
      notificationUpserts[1].rows[0].dedupe_key
    );
  });

  it("builds recipient-aware action URLs for mixed recipient events", async () => {
    mockGetBarangayOfficialRecipients.mockResolvedValueOnce([
      {
        userId: "bo-1",
        role: "barangay_official",
        email: "bo1@example.com",
        scopeType: "barangay",
      },
    ]);
    mockGetCitizenRecipientsForBarangay.mockResolvedValueOnce([
      {
        userId: "citizen-1",
        role: "citizen",
        email: "citizen1@example.com",
        scopeType: "citizen",
      },
    ]);

    await notify({
      eventType: "AIP_PUBLISHED",
      scopeType: "barangay",
      entityType: "aip",
      aipId: "aip-1",
      barangayId: "brgy-1",
      cityId: "city-1",
      entityId: "aip-1",
    });

    expect(notificationUpserts).toHaveLength(1);
    const rows = notificationUpserts[0].rows;
    const byUserId = new Map(rows.map((row) => [String(row.recipient_user_id), row]));
    expect(byUserId.get("bo-1")?.action_url).toBe("/barangay/aips/aip-1");
    expect(byUserId.get("citizen-1")?.action_url).toBe("/aips/aip-1");

    expect(emailUpserts).toHaveLength(1);
    const emailRows = emailUpserts[0].rows;
    const emailByUserId = new Map(emailRows.map((row) => [String(row.recipient_user_id), row]));
    expect(emailByUserId.get("bo-1")?.payload).toMatchObject({
      action_url: "/barangay/aips/aip-1",
    });
    expect(emailByUserId.get("citizen-1")?.payload).toMatchObject({
      action_url: "/aips/aip-1",
    });
  });
});
