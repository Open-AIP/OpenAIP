import { assertEquals } from "jsr:@std/assert@1";
import {
  buildOutboxFailureThresholdNotifications,
  handleRequest,
  isAuthorizedRequest,
  processOutboxBatch,
  renderTemplateHtml,
  renderTemplateText,
  type OutboxRow,
} from "./index.ts";

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function makeQueuedRow(overrides: Partial<OutboxRow> = {}): OutboxRow {
  return {
    id: "row-1",
    recipient_user_id: "user-1",
    to_email: "citizen@example.com",
    template_key: "AIP_PUBLISHED",
    subject: "OpenAIP update",
    payload: {
      title: "AIP Published",
      message: "AIP has been published.",
      action_url: "/notifications",
    },
    status: "queued",
    attempt_count: 0,
    last_error: null,
    created_at: "2026-03-03T00:00:00.000Z",
    sent_at: null,
    dedupe_key: "AIP_PUBLISHED:aip:123:draft->published",
    ...overrides,
  };
}

Deno.test("isAuthorizedRequest accepts bearer jwt with service_role claim", () => {
  const serviceToken = makeJwt({ role: "service_role", sub: "svc" });
  const request = new Request("http://localhost/functions/v1/send-email-outbox", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceToken}`,
    },
  });

  assertEquals(isAuthorizedRequest(request), true);
});

Deno.test("isAuthorizedRequest rejects jwt without service_role claim", () => {
  const anonToken = makeJwt({ role: "authenticated", sub: "user-1" });
  const request = new Request("http://localhost/functions/v1/send-email-outbox", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonToken}`,
    },
  });

  assertEquals(isAuthorizedRequest(request), false);
});

Deno.test("handleRequest rejects non-service-role authorization", async () => {
  const badToken = makeJwt({ role: "authenticated", sub: "user-1" });
  const request = new Request("http://localhost/functions/v1/send-email-outbox", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${badToken}`,
    },
    body: JSON.stringify({}),
  });

  const response = await handleRequest(request);
  assertEquals(response.status, 401);
});

Deno.test("processOutboxBatch marks successful sends as sent", async () => {
  const now = new Date("2026-03-03T01:00:00.000Z");
  const rows = [makeQueuedRow()];
  let sentText: string | null = null;
  let sentHtml: string | null = null;

  const summary = await processOutboxBatch({
    rows,
    now,
    maxAttempts: 5,
    resendApiKey: "resend-key",
    fromEmail: "OpenAIP <noreply@example.com>",
    appBaseUrl: "https://openaip.example.com",
    sendEmailFn: async (args) => {
      sentHtml = args.html;
      sentText = args.text;
      return { ok: true, error: null };
    },
  });

  assertEquals(summary.fetched, 1);
  assertEquals(summary.eligible, 1);
  assertEquals(summary.sent, 1);
  assertEquals(summary.failed, 0);
  assertEquals(summary.patches.length, 1);
  assertEquals(summary.patches[0].status, "sent");
  assertEquals(summary.patches[0].attempt_count, 1);
  assertEquals(summary.patches[0].last_error, null);
  assertEquals(typeof sentHtml === "string" && sentHtml.length > 0, true);
  assertEquals(typeof sentText === "string" && sentText.length > 0, true);
});

Deno.test("processOutboxBatch increments attempts and marks failed at max attempts", async () => {
  const now = new Date("2026-03-03T01:00:00.000Z");
  const rows = [
    makeQueuedRow({ id: "row-retry", attempt_count: 1, created_at: "2026-03-03T00:00:00.000Z" }),
    makeQueuedRow({ id: "row-fail", attempt_count: 4, created_at: "2026-03-03T00:00:00.000Z" }),
  ];

  const summary = await processOutboxBatch({
    rows,
    now,
    maxAttempts: 5,
    resendApiKey: "resend-key",
    fromEmail: "OpenAIP <noreply@example.com>",
    appBaseUrl: "https://openaip.example.com",
    sendEmailFn: async () => ({ ok: false, error: "SMTP timeout" }),
  });

  assertEquals(summary.sent, 0);
  assertEquals(summary.failed, 2);
  assertEquals(summary.queuedForRetry, 1);
  assertEquals(summary.patches.find((patch) => patch.id === "row-retry")?.status, "queued");
  assertEquals(summary.patches.find((patch) => patch.id === "row-retry")?.attempt_count, 2);
  assertEquals(summary.patches.find((patch) => patch.id === "row-fail")?.status, "failed");
  assertEquals(summary.patches.find((patch) => patch.id === "row-fail")?.attempt_count, 5);
});

Deno.test("buildOutboxFailureThresholdNotifications builds deduped hourly admin alerts", () => {
  const now = new Date("2026-03-03T05:10:00.000Z");
  const notifications = buildOutboxFailureThresholdNotifications({
    adminRecipients: [
      { id: "admin-1", role: "admin" },
      { id: "admin-2", role: "admin" },
    ],
    failedCountLastHour: 31,
    threshold: 20,
    now,
  });

  assertEquals(notifications.length, 2);
  assertEquals(
    notifications[0].dedupe_key,
    "OUTBOX_FAILURE_THRESHOLD_REACHED:system:outbox_failures:2026-03-03T05"
  );
  assertEquals(notifications[0].event_type, "OUTBOX_FAILURE_THRESHOLD_REACHED");
  assertEquals(notifications[1].dedupe_key, notifications[0].dedupe_key);
});

Deno.test("renderTemplateHtml wraps internal action links with tracked-open route", () => {
  const html = renderTemplateHtml(
    "AIP_PUBLISHED",
    "AIP Published",
    {
      title: "AIP Published",
      message: "AIP has been published.",
      action_url: "/aips/aip-1",
      notification_ref: "AIP_PUBLISHED:aip:aip-1:draft->published",
    },
    "https://openaip.example.com"
  );

  assertEquals(
    html.includes(
      "/api/notifications/open?dedupe=AIP_PUBLISHED%3Aaip%3Aaip-1%3Adraft-%3Epublished&next=%2Faips%2Faip-1"
    ),
    true
  );
});

Deno.test("renderTemplateHtml uses OTP-inspired structure and event/context sections", () => {
  const html = renderTemplateHtml(
    "FEEDBACK_VISIBILITY_CHANGED",
    "Feedback visibility changed",
    {
      title: "Feedback Visibility Updated",
      message: "A feedback visibility update was recorded.",
      event_type: "FEEDBACK_VISIBILITY_CHANGED",
      scope_type: "city",
      entity_type: "feedback",
      transition: "visible->hidden",
      reason: "Policy violation",
      action_url: "/city/feedback?comment=fb-1",
    },
    "https://openaip.example.com"
  );

  assertEquals(html.includes("Moderation Update"), true);
  assertEquals(html.includes("Feedback Visibility Updated"), true);
  assertEquals(html.includes("DETAILS"), true);
  assertEquals(html.includes("Status: <strong>Hidden</strong>"), true);
  assertEquals(html.includes("Reason: <strong>Policy violation</strong>"), true);
  assertEquals(html.includes("View Feedback"), true);
  assertEquals(html.includes("This is an automated message from OpenAIP."), true);
});

Deno.test("renderTemplateHtml omits transition and reason rows when not present", () => {
  const html = renderTemplateHtml(
    "AIP_PUBLISHED",
    "AIP Published",
    {
      title: "AIP Published",
      message: "An AIP was published.",
      event_type: "AIP_PUBLISHED",
      scope_type: "barangay",
      entity_type: "aip",
    },
    "https://openaip.example.com"
  );

  assertEquals(html.includes("DETAILS"), true);
  assertEquals(html.includes("Old status"), false);
  assertEquals(html.includes("Reason"), false);
});

Deno.test("renderTemplateText returns deterministic plain text fallback", () => {
  const text = renderTemplateText(
    "AIP_PUBLISHED",
    "AIP Published",
    {
      title: "AIP Published",
      message: "An AIP was published.",
      event_type: "AIP_PUBLISHED",
      scope_type: "citizen",
      entity_type: "aip",
      action_url: "/aips/aip-1",
      notification_ref: "AIP_PUBLISHED:aip:aip-1:draft->published",
    },
    "https://openaip.example.com"
  );

  assertEquals(text.includes("OpenAIP - Publication Notice"), true);
  assertEquals(text.includes("AIP Published"), true);
  assertEquals(text.includes("DETAILS"), true);
  assertEquals(text.includes("Open in OpenAIP: https://openaip.example.com/api/notifications/open?"), true);
  assertEquals(text.includes("<div"), false);
});

Deno.test("renderTemplateHtml supports event-specific headings", () => {
  const events: Array<{ key: string; expectedHeading: string; expectedSubtitle: string }> = [
    { key: "AIP_CLAIMED", expectedHeading: "AIP Claimed for Review", expectedSubtitle: "AIP Review Update" },
    { key: "AIP_REVISION_REQUESTED", expectedHeading: "Revision Requested", expectedSubtitle: "AIP Revision Request" },
    { key: "AIP_PUBLISHED", expectedHeading: "AIP Published", expectedSubtitle: "Publication Notice" },
    { key: "AIP_SUBMITTED", expectedHeading: "AIP Submitted for Review", expectedSubtitle: "City Review Queue" },
    { key: "AIP_RESUBMITTED", expectedHeading: "AIP Resubmitted", expectedSubtitle: "City Review Queue" },
    { key: "FEEDBACK_CREATED", expectedHeading: "New Feedback Received", expectedSubtitle: "Citizen Engagement" },
    {
      key: "FEEDBACK_VISIBILITY_CHANGED",
      expectedHeading: "Feedback Visibility Updated",
      expectedSubtitle: "Moderation Update",
    },
    {
      key: "PROJECT_UPDATE_STATUS_CHANGED",
      expectedHeading: "Project Update Status Changed",
      expectedSubtitle: "Project Updates",
    },
    {
      key: "OUTBOX_FAILURE_THRESHOLD_REACHED",
      expectedHeading: "Email Outbox Failure Threshold Reached",
      expectedSubtitle: "System Alert",
    },
    { key: "MODERATION_ACTION_AUDIT", expectedHeading: "Moderation Action Audit", expectedSubtitle: "Audit Log" },
    { key: "PIPELINE_JOB_FAILED", expectedHeading: "Pipeline Job Failed", expectedSubtitle: "Pipeline Alert" },
  ];

  for (const entry of events) {
    const html = renderTemplateHtml(
      entry.key,
      "OpenAIP update",
      {
        title: "OpenAIP update",
        message: "Message",
        event_type: entry.key,
        action_url: "/notifications",
      },
      "https://openaip.example.com"
    );

    assertEquals(html.includes(entry.expectedHeading), true);
    assertEquals(html.includes(entry.expectedSubtitle), true);
  }
});
