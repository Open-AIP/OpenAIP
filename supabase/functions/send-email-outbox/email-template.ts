type RenderNotificationEmailArgs = {
  templateKey: string;
  subject: string;
  payload: unknown;
  appBaseUrl: string;
};

type RenderedNotificationEmail = {
  html: string;
  text: string;
};

type DetailRow = {
  label: string;
  value: string | null;
};

type EventTemplateSpec = {
  subtitle: string;
  heading: string;
  ctaLabel: string;
  detailsLabel: string;
  intro: (context: NormalizedNotificationEmailContext) => string;
  details: (context: NormalizedNotificationEmailContext) => DetailRow[];
  advisoryTitle?: string;
  advisoryBody?: string;
};

type NotificationTemplateDetails = {
  eventType: string;
  scopeType: string | null;
  scopeLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  actorName: string | null;
  actorRole: string | null;
  occurredAt: string | null;
  fiscalYear: number | null;
  lguName: string | null;
  revisionNotes: string | null;
  revisionReason: string | null;
  entityLabel: string | null;
  feedbackKind: string | null;
  feedbackExcerpt: string | null;
  visibilityAction: string | null;
  newVisibility: string | null;
  oldStatusLabel: string | null;
  newStatusLabel: string | null;
  projectName: string | null;
  moderationAction: string | null;
  moderationReason: string | null;
  windowLabel: string | null;
  failedCount: number | null;
  threshold: number | null;
  lastErrorSample: string | null;
  stage: string | null;
  runId: string | null;
  aipId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

type NormalizedNotificationEmailContext = {
  title: string;
  message: string;
  eventType: string;
  actionUrl: string | null;
  details: NotificationTemplateDetails;
};

const MAX_GENERIC_TEXT = 500;
const MAX_FEEDBACK_EXCERPT = 200;
const MAX_REASON_TEXT = 240;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function cleanText(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  const sanitized = value
    .replaceAll(/[\u0000-\u001f\u007f]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  if (!sanitized) return null;
  if (sanitized.length <= maxLength) return sanitized;
  return `${sanitized.slice(0, Math.max(1, maxLength - 3)).trimEnd()}...`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanizeToken(value: string | null): string | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/\s+/g, " ");
  if (!normalized) return null;

  return normalized
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.startsWith("/\\")) return false;
  return true;
}

function toInternalTargetPath(actionUrl: string, appBaseUrl: string): string | null {
  const normalizedAction = actionUrl.trim();
  if (!normalizedAction) return null;

  if (normalizedAction.startsWith("http://") || normalizedAction.startsWith("https://")) {
    try {
      const absoluteUrl = new URL(normalizedAction);
      const baseUrl = new URL(appBaseUrl);
      if (absoluteUrl.origin !== baseUrl.origin) return null;
      const targetPath = `${absoluteUrl.pathname}${absoluteUrl.search}${absoluteUrl.hash}`;
      return isSafeInternalPath(targetPath) ? targetPath : null;
    } catch {
      return null;
    }
  }

  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(normalizedAction)) return null;
  if (normalizedAction.startsWith("//")) return null;
  const normalizedPath = normalizedAction.startsWith("/")
    ? normalizedAction
    : `/${normalizedAction}`;
  return isSafeInternalPath(normalizedPath) ? normalizedPath : null;
}

function resolveActionUrl(payload: Record<string, unknown>, appBaseUrl: string): string | null {
  const actionUrl = readString(payload.action_url) ?? readString(payload.actionUrl);
  if (!actionUrl) return null;

  const normalizedBase = appBaseUrl.replace(/\/+$/, "");
  const targetPath = toInternalTargetPath(actionUrl, normalizedBase);
  const notificationRef =
    readString(payload.notification_ref) ?? readString(payload.notificationRef);

  if (targetPath && notificationRef) {
    const trackedParams = new URLSearchParams({
      dedupe: notificationRef,
      next: targetPath,
    });
    return `${normalizedBase}/api/notifications/open?${trackedParams.toString()}`;
  }

  if (targetPath) {
    return `${normalizedBase}${targetPath}`;
  }

  if (actionUrl.startsWith("http://") || actionUrl.startsWith("https://")) {
    return actionUrl;
  }

  return null;
}

function formatOccurredAtPht(value: string | null): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;

  try {
    const formatter = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formatter.format(new Date(timestamp))} PHT`;
  } catch {
    return value;
  }
}

function firstValue(input: Array<unknown>): unknown {
  for (const value of input) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function toStringValue(input: Array<unknown>, maxLength = MAX_GENERIC_TEXT): string | null {
  const value = firstValue(input);
  return cleanText(readString(value), maxLength);
}

function toNumberValue(input: Array<unknown>): number | null {
  return readNumber(firstValue(input));
}

function normalizeNotificationContext(args: RenderNotificationEmailArgs): NormalizedNotificationEmailContext {
  const payload = asRecord(args.payload);
  const templateData = asRecord(payload.template_data);
  const metadata = asRecord(payload.metadata);

  const eventType = (
    toStringValue([payload.event_type, payload.eventType, templateData.event_type, metadata.event_type]) ??
    args.templateKey
  ).toUpperCase();

  const title = toStringValue([payload.title, templateData.title], MAX_REASON_TEXT) ?? args.subject;
  const message =
    toStringValue([payload.message, templateData.message], MAX_GENERIC_TEXT) ??
    "A new OpenAIP notification is available.";

  const occurredAtRaw = toStringValue(
    [templateData.occurred_at, metadata.occurred_at, payload.occurred_at, payload.created_at],
    MAX_REASON_TEXT
  );

  return {
    title,
    message,
    eventType,
    actionUrl: resolveActionUrl(payload, args.appBaseUrl),
    details: {
      eventType,
      scopeType: toStringValue([templateData.scope_type, metadata.scope_type, payload.scope_type]),
      scopeLabel: toStringValue([templateData.scope_label, metadata.scope_label]),
      entityType: toStringValue([templateData.entity_type, metadata.entity_type, payload.entity_type]),
      entityId: toStringValue([templateData.entity_id, metadata.entity_id, payload.entity_id]),
      actorName: toStringValue([templateData.actor_name, metadata.actor_name, payload.actor_name], 120),
      actorRole: toStringValue([templateData.actor_role, metadata.actor_role, payload.actor_role], 120),
      occurredAt: formatOccurredAtPht(occurredAtRaw),
      fiscalYear: toNumberValue([templateData.fiscal_year, metadata.fiscal_year, payload.fiscal_year]),
      lguName: toStringValue([templateData.lgu_name, metadata.lgu_name]),
      revisionNotes: toStringValue([templateData.revision_notes, metadata.revision_notes], MAX_REASON_TEXT),
      revisionReason: toStringValue(
        [templateData.revision_reason, metadata.revision_reason],
        MAX_REASON_TEXT
      ),
      entityLabel: toStringValue([templateData.entity_label, metadata.entity_label], MAX_REASON_TEXT),
      feedbackKind: toStringValue([templateData.feedback_kind, metadata.feedback_kind], MAX_REASON_TEXT),
      feedbackExcerpt: toStringValue(
        [templateData.feedback_excerpt, metadata.feedback_excerpt],
        MAX_FEEDBACK_EXCERPT
      ),
      visibilityAction: toStringValue(
        [templateData.visibility_action, metadata.visibility_action],
        MAX_REASON_TEXT
      ),
      newVisibility: toStringValue([templateData.new_visibility, metadata.new_visibility], MAX_REASON_TEXT),
      oldStatusLabel: toStringValue(
        [templateData.old_status_label, metadata.old_status_label],
        MAX_REASON_TEXT
      ),
      newStatusLabel: toStringValue(
        [templateData.new_status_label, metadata.new_status_label],
        MAX_REASON_TEXT
      ),
      projectName: toStringValue([templateData.project_name, metadata.project_name], MAX_REASON_TEXT),
      moderationAction: toStringValue(
        [templateData.moderation_action, metadata.moderation_action],
        MAX_REASON_TEXT
      ),
      moderationReason: toStringValue(
        [templateData.moderation_reason, metadata.moderation_reason, templateData.reason, metadata.reason],
        MAX_REASON_TEXT
      ),
      windowLabel: toStringValue([templateData.window_label, metadata.window_label], MAX_REASON_TEXT),
      failedCount: toNumberValue([templateData.failed_count, metadata.failed_count, metadata.failed_count_last_hour]),
      threshold: toNumberValue([templateData.threshold, metadata.threshold]),
      lastErrorSample: toStringValue(
        [templateData.last_error_sample, metadata.last_error_sample, metadata.last_error],
        MAX_REASON_TEXT
      ),
      stage: toStringValue([templateData.stage, metadata.stage], MAX_REASON_TEXT),
      runId: toStringValue([templateData.run_id, metadata.run_id], MAX_REASON_TEXT),
      aipId: toStringValue([templateData.aip_id, metadata.aip_id, payload.aip_id], MAX_REASON_TEXT),
      errorCode: toStringValue([templateData.error_code, metadata.error_code], MAX_REASON_TEXT),
      errorMessage: toStringValue([templateData.error_message, metadata.error_message], MAX_REASON_TEXT),
    },
  };
}

function buildDetailsRows(rows: DetailRow[]): DetailRow[] {
  return rows.filter((row) => !!row.value);
}

function fyLabel(fiscalYear: number | null): string | null {
  if (!Number.isFinite(fiscalYear ?? null)) return null;
  return `FY ${fiscalYear}`;
}

const TEMPLATE_REGISTRY: Record<string, EventTemplateSpec> = {
  AIP_CLAIMED: {
    subtitle: "AIP Review Update",
    heading: "AIP Claimed for Review",
    ctaLabel: "View AIP Status",
    detailsLabel: "DETAILS",
    intro: (context) => {
      const scope = context.details.scopeLabel ?? humanizeToken(context.details.scopeType) ?? "LGU";
      const fy = fyLabel(context.details.fiscalYear);
      if (fy) {
        return `Your ${scope} AIP for ${fy} has been claimed for review by a City Official.`;
      }
      return `Your ${scope} AIP has been claimed for review by a City Official.`;
    },
    details: (context) =>
      buildDetailsRows([
        { label: "LGU", value: context.details.lguName },
        { label: "Claimed by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Claimed at", value: context.details.occurredAt },
      ]),
    advisoryTitle: "Security Notice",
    advisoryBody:
      "This is an automated workflow notification. If you did not expect this action, contact your administrator.",
  },
  AIP_REVISION_REQUESTED: {
    subtitle: "AIP Revision Request",
    heading: "Revision Requested",
    ctaLabel: "Open Revision Workspace",
    detailsLabel: "REVISION NOTES",
    intro: (context) => {
      const scope = context.details.scopeLabel ?? humanizeToken(context.details.scopeType) ?? "LGU";
      const fy = fyLabel(context.details.fiscalYear);
      if (fy) {
        return `A City Official requested revisions for your ${scope} AIP for ${fy}. Please review the notes and submit a revised file.`;
      }
      return `A City Official requested revisions for your ${scope} AIP. Please review the notes and submit a revised file.`;
    },
    details: (context) =>
      buildDetailsRows([
        { label: "Notes", value: context.details.revisionNotes ?? context.details.revisionReason },
        { label: "Requested by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Requested at", value: context.details.occurredAt },
      ]),
    advisoryTitle: "Reminder",
    advisoryBody:
      "Draft and revision details are visible only to authorized officials. Citizens can only see public workflow status.",
  },
  AIP_PUBLISHED: {
    subtitle: "Publication Notice",
    heading: "AIP Published",
    ctaLabel: "View Published AIP",
    detailsLabel: "DETAILS",
    intro: (context) => {
      const scope = context.details.scopeLabel ?? humanizeToken(context.details.scopeType) ?? "LGU";
      const fy = fyLabel(context.details.fiscalYear);
      if (fy) {
        return `The ${scope} AIP for ${fy} has been published and is now visible on the citizen portal.`;
      }
      return `An AIP has been published and is now visible on the citizen portal.`;
    },
    details: (context) =>
      buildDetailsRows([
        { label: "LGU", value: context.details.lguName },
        { label: "Published by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Published at", value: context.details.occurredAt },
      ]),
    advisoryTitle: "What Is Included",
    advisoryBody:
      "Citizens can view published AIP documents, summaries, dashboards, and public comments. Draft and revision data remains restricted.",
  },
  AIP_SUBMITTED: {
    subtitle: "City Review Queue",
    heading: "AIP Submitted for Review",
    ctaLabel: "Open Review Queue",
    detailsLabel: "DETAILS",
    intro: (context) => {
      const fy = fyLabel(context.details.fiscalYear);
      if (fy) {
        return `A Barangay Official submitted an AIP for ${fy}. This submission is now in the review queue.`;
      }
      return "A Barangay Official submitted an AIP that is now in the review queue.";
    },
    details: (context) =>
      buildDetailsRows([
        { label: "LGU", value: context.details.lguName },
        { label: "Submitted by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Submitted at", value: context.details.occurredAt },
      ]),
  },
  AIP_RESUBMITTED: {
    subtitle: "City Review Queue",
    heading: "AIP Resubmitted",
    ctaLabel: "Review Resubmission",
    detailsLabel: "DETAILS",
    intro: (context) => {
      const fy = fyLabel(context.details.fiscalYear);
      if (fy) {
        return `A Barangay Official resubmitted the AIP for ${fy} after applying requested revisions.`;
      }
      return "A Barangay Official resubmitted an AIP after applying requested revisions.";
    },
    details: (context) =>
      buildDetailsRows([
        { label: "LGU", value: context.details.lguName },
        { label: "Resubmitted by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Resubmitted at", value: context.details.occurredAt },
        { label: "Revision reason", value: context.details.revisionReason ?? context.details.revisionNotes },
      ]),
  },
  FEEDBACK_CREATED: {
    subtitle: "Citizen Engagement",
    heading: "New Feedback Received",
    ctaLabel: "View and Reply",
    detailsLabel: "FEEDBACK PREVIEW",
    intro: (context) =>
      context.details.entityLabel
        ? `A user posted new feedback on ${context.details.entityLabel}.`
        : "A user posted new feedback.",
    details: (context) =>
      buildDetailsRows([
        { label: "From", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "LGU", value: context.details.lguName },
        { label: "Type", value: humanizeToken(context.details.feedbackKind) },
        { label: "Posted at", value: context.details.occurredAt },
        { label: "Excerpt", value: context.details.feedbackExcerpt },
      ]),
    advisoryTitle: "Privacy Reminder",
    advisoryBody:
      "Do not include personal beneficiary information in replies. Keep responses professional and evidence-based.",
  },
  FEEDBACK_VISIBILITY_CHANGED: {
    subtitle: "Moderation Update",
    heading: "Feedback Visibility Updated",
    ctaLabel: "View Feedback",
    detailsLabel: "DETAILS",
    intro: (context) => {
      const target = context.details.entityLabel ? ` on ${context.details.entityLabel}` : "";
      const action = context.details.visibilityAction ?? "updated";
      return `Your feedback${target} was ${action} by an administrator.`;
    },
    details: (context) =>
      buildDetailsRows([
        { label: "Status", value: context.details.newVisibility },
        { label: "Updated at", value: context.details.occurredAt },
        { label: "Reason", value: context.details.moderationReason },
        { label: "Excerpt", value: context.details.feedbackExcerpt },
      ]),
    advisoryTitle: "Note",
    advisoryBody:
      "OpenAIP moderates feedback to maintain constructive public discussion. If you believe this is an error, contact your LGU.",
  },
  PROJECT_UPDATE_STATUS_CHANGED: {
    subtitle: "Project Updates",
    heading: "Project Update Status Changed",
    ctaLabel: "View Project Update",
    detailsLabel: "DETAILS",
    intro: (context) => {
      const name = context.details.projectName ?? "the project";
      const status = context.details.newStatusLabel ?? "updated";
      return `An update for ${name} is now ${status}.`;
    },
    details: (context) =>
      buildDetailsRows([
        { label: "LGU", value: context.details.lguName },
        { label: "Old status", value: context.details.oldStatusLabel },
        { label: "New status", value: context.details.newStatusLabel },
        { label: "Updated by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Updated at", value: context.details.occurredAt },
      ]),
    advisoryTitle: "Visibility",
    advisoryBody:
      "Only published updates are visible to citizens. Hidden updates remain restricted.",
  },
  OUTBOX_FAILURE_THRESHOLD_REACHED: {
    subtitle: "System Alert",
    heading: "Email Outbox Failure Threshold Reached",
    ctaLabel: "Open Outbox Dashboard",
    detailsLabel: "ALERT DETAILS",
    intro: () =>
      "The email outbox is experiencing elevated failures. Please investigate to prevent missed workflow notifications.",
    details: (context) =>
      buildDetailsRows([
        { label: "Window", value: context.details.windowLabel ?? "Last 60 minutes" },
        {
          label: "Failed count",
          value:
            typeof context.details.failedCount === "number"
              ? String(context.details.failedCount)
              : null,
        },
        {
          label: "Threshold",
          value:
            typeof context.details.threshold === "number"
              ? String(context.details.threshold)
              : null,
        },
        { label: "Last error sample", value: context.details.lastErrorSample },
        { label: "Detected at", value: context.details.occurredAt },
      ]),
    advisoryTitle: "Suggested Checks",
    advisoryBody:
      "Verify Resend API status, function logs, rate limits, retry settings, and sender identity configuration.",
  },
  MODERATION_ACTION_AUDIT: {
    subtitle: "Audit Log",
    heading: "Moderation Action Audit",
    ctaLabel: "View Audit Entry",
    detailsLabel: "ACTION DETAILS",
    intro: () =>
      "A moderation action was performed and recorded for audit purposes.",
    details: (context) =>
      buildDetailsRows([
        { label: "Action", value: context.details.moderationAction },
        { label: "Target", value: context.details.entityLabel ?? context.details.entityType },
        { label: "Target ID", value: context.details.entityId },
        { label: "Performed by", value: context.details.actorName },
        { label: "Role", value: context.details.actorRole },
        { label: "Reason", value: context.details.moderationReason },
        { label: "Timestamp", value: context.details.occurredAt },
      ]),
    advisoryTitle: "Integrity Notice",
    advisoryBody:
      "Keep moderation reasons clear and objective. This record supports accountability and non-repudiation.",
  },
  PIPELINE_JOB_FAILED: {
    subtitle: "Pipeline Alert",
    heading: "Pipeline Job Failed",
    ctaLabel: "Open Run Details",
    detailsLabel: "FAILURE DETAILS",
    intro: (context) => {
      if (context.details.stage) {
        return `A pipeline job failed during the ${context.details.stage} stage. Review logs and rerun if needed.`;
      }
      return "A pipeline job failed. Review logs and rerun if needed.";
    },
    details: (context) =>
      buildDetailsRows([
        { label: "AIP ID", value: context.details.aipId },
        { label: "Run ID", value: context.details.runId },
        { label: "Stage", value: context.details.stage },
        { label: "Error code", value: context.details.errorCode },
        { label: "Error message", value: context.details.errorMessage },
        { label: "Failed at", value: context.details.occurredAt },
      ]),
    advisoryTitle: "Suggested Actions",
    advisoryBody:
      "Confirm uploaded PDF validity, pipeline connectivity, and quota or rate limits. If persistent, investigate recent deployments and migrations.",
  },
};

const GENERIC_TEMPLATE: EventTemplateSpec = {
  subtitle: "Notification Update",
  heading: "OpenAIP Notification",
  ctaLabel: "Open in OpenAIP",
  detailsLabel: "DETAILS",
  intro: () => "A new OpenAIP notification is available.",
  details: (context) =>
    buildDetailsRows([
      { label: "Event", value: humanizeToken(context.eventType) },
      { label: "Scope", value: humanizeToken(context.details.scopeType) },
      { label: "Entity", value: humanizeToken(context.details.entityType) },
      { label: "Time", value: context.details.occurredAt },
    ]),
  advisoryTitle: "Security Notice",
  advisoryBody:
    "This notification was sent automatically by OpenAIP. If you did not expect this message, review your account activity.",
};

function renderDetailRowsHtml(rows: DetailRow[]): string {
  if (rows.length === 0) {
    return '<p style="margin: 0 0 6px; color: #334155;">No additional details available.</p>';
  }

  return rows
    .map(
      (row) =>
        `<div style="font-size: 13px; color: #334155; margin: 0 0 6px;">${escapeHtml(
          row.label
        )}: <strong>${escapeHtml(row.value ?? "")}</strong></div>`
    )
    .join("");
}

function renderDetailRowsText(rows: DetailRow[]): string {
  if (rows.length === 0) return "No additional details available.";
  return rows.map((row) => `${row.label}: ${row.value ?? ""}`).join("\n");
}

function renderNotificationHtml(context: NormalizedNotificationEmailContext): string {
  const spec = TEMPLATE_REGISTRY[context.eventType] ?? GENERIC_TEMPLATE;
  const detailRows = spec.details(context);
  const intro = cleanText(spec.intro(context), MAX_GENERIC_TEXT) ?? "A new notification is available.";
  const includeMessage =
    context.message.trim().toLowerCase() !== intro.trim().toLowerCase();

  return [
    "<!doctype html>",
    "<html><body>",
    '<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a;">',
    '<div style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">',
    '<div style="font-size: 18px; font-weight: 700; letter-spacing: 0.2px;">OpenAIP</div>',
    `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${escapeHtml(
      spec.subtitle
    )}</div>`,
    "</div>",
    '<div style="padding: 20px;">',
    `<h2 style="margin: 0 0 10px; font-size: 18px;">${escapeHtml(spec.heading)}</h2>`,
    `<p style="margin: 0 0 14px; color: #334155;">${escapeHtml(intro)}</p>`,
    includeMessage
      ? `<p style="margin: 0 0 14px; color: #334155;">${escapeHtml(context.message)}</p>`
      : "",
    '<div style="margin: 14px 0 16px; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px;">',
    `<div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">${escapeHtml(
      spec.detailsLabel
    )}</div>`,
    renderDetailRowsHtml(detailRows),
    "</div>",
    context.actionUrl
      ? `<a href="${escapeHtml(
          context.actionUrl
        )}" style="display: inline-block; text-decoration: none; padding: 12px 14px; border-radius: 12px; background: #0b1220; color: #e2e8f0; font-weight: 700; font-size: 13px;">${escapeHtml(
          spec.ctaLabel
        )}</a>`
      : "",
    '<hr style="margin: 18px 0; border: none; border-top: 1px solid #e2e8f0;" />',
    '<div style="font-size: 12.5px; color: #334155;">',
    `<div style="font-weight: 700; margin-bottom: 6px;">${escapeHtml(
      spec.advisoryTitle ?? "Security Notice"
    )}</div>`,
    `<p style="margin: 0;">${escapeHtml(
      spec.advisoryBody ??
        "This notification was sent automatically by OpenAIP. If you did not expect this message, review your account activity and notification settings."
    )}</p>`,
    "</div>",
    "</div>",
    '<div style="padding: 14px 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11.5px;">This is an automated message from OpenAIP. Please do not reply to this email.</div>',
    "</div>",
    "</body></html>",
  ].join("");
}

function renderNotificationText(context: NormalizedNotificationEmailContext): string {
  const spec = TEMPLATE_REGISTRY[context.eventType] ?? GENERIC_TEMPLATE;
  const detailRows = spec.details(context);
  const intro = cleanText(spec.intro(context), MAX_GENERIC_TEXT) ?? "A new notification is available.";
  const lines = [
    `OpenAIP - ${spec.subtitle}`,
    "",
    spec.heading,
    "",
    intro,
  ];

  if (context.message.trim().toLowerCase() !== intro.trim().toLowerCase()) {
    lines.push("");
    lines.push(context.message);
  }

  lines.push("");
  lines.push(spec.detailsLabel);
  lines.push(renderDetailRowsText(detailRows));

  if (context.actionUrl) {
    lines.push("");
    lines.push(`${spec.ctaLabel}: ${context.actionUrl}`);
  }

  lines.push("");
  lines.push(spec.advisoryTitle ?? "Security Notice");
  lines.push(
    spec.advisoryBody ??
      "This notification was sent automatically by OpenAIP. If you did not expect this message, review your account activity and notification settings."
  );
  lines.push("");
  lines.push("This is an automated message from OpenAIP. Please do not reply to this email.");

  return lines.join("\n");
}

export function renderNotificationEmail(
  args: RenderNotificationEmailArgs
): RenderedNotificationEmail {
  const context = normalizeNotificationContext(args);
  return {
    html: renderNotificationHtml(context),
    text: renderNotificationText(context),
  };
}

export function renderTemplateHtml(
  templateKey: string,
  subject: string,
  payload: Record<string, unknown>,
  appBaseUrl: string
): string {
  return renderNotificationEmail({ templateKey, subject, payload, appBaseUrl }).html;
}

export function renderTemplateText(
  templateKey: string,
  subject: string,
  payload: Record<string, unknown>,
  appBaseUrl: string
): string {
  return renderNotificationEmail({ templateKey, subject, payload, appBaseUrl }).text;
}
