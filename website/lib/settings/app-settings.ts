import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type CommentRateLimitSetting = {
  maxComments: number;
  timeWindow: "hour" | "day";
  updatedAt?: string;
  updatedBy?: string | null;
};

export type ChatbotRateLimitSetting = {
  maxRequests: number;
  timeWindow: "per_hour" | "per_day";
  updatedAt?: string;
  updatedBy?: string | null;
};

export type ChatbotSystemPolicySetting = {
  isEnabled: boolean;
  retentionDays: number;
  userDisclaimer: string;
  updatedAt?: string;
  updatedBy?: string | null;
};

export type SecuritySettingsValue = {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialCharacters: boolean;
  };
  sessionTimeout: {
    timeoutValue: number;
    timeUnit: "minutes" | "hours" | "days";
    warningMinutes: number;
  };
  loginAttemptLimits: {
    maxAttempts: number;
    lockoutDuration: number;
    lockoutUnit: "minutes" | "hours";
  };
};

export type NotificationSettingsValue = {
  reviewNotificationsEnabled: boolean;
  submissionAlertsEnabled: boolean;
};

export type SystemBannerDraftValue = {
  title?: string | null;
  message: string;
  severity: "Info" | "Warning" | "Critical";
  startAt?: string | null;
  endAt?: string | null;
};

export type BlockedUserSetting = {
  blockedUntil: string;
  reason: string;
  updatedAt: string;
  updatedBy?: string | null;
};

export type BlockedUsersSetting = Record<string, BlockedUserSetting>;

export type AppSettingsMap = {
  "controls.comment_rate_limit": CommentRateLimitSetting;
  "controls.chatbot_rate_limit": ChatbotRateLimitSetting;
  "controls.chatbot_policy": ChatbotSystemPolicySetting;
  "controls.blocked_users": BlockedUsersSetting;
  "system.security_settings": SecuritySettingsValue;
  "system.notification_settings": NotificationSettingsValue;
  "system.banner_draft": SystemBannerDraftValue;
};

const DEFAULT_SETTINGS: AppSettingsMap = {
  "controls.comment_rate_limit": {
    maxComments: 5,
    timeWindow: "hour",
  },
  "controls.chatbot_rate_limit": {
    maxRequests: 20,
    timeWindow: "per_hour",
  },
  "controls.chatbot_policy": {
    isEnabled: true,
    retentionDays: 90,
    userDisclaimer:
      "This disclaimer will be shown to users before they interact with the chatbot.",
  },
  "controls.blocked_users": {},
  "system.security_settings": {
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialCharacters: true,
    },
    sessionTimeout: {
      timeoutValue: 30,
      timeUnit: "minutes",
      warningMinutes: 5,
    },
    loginAttemptLimits: {
      maxAttempts: 5,
      lockoutDuration: 30,
      lockoutUnit: "minutes",
    },
  },
  "system.notification_settings": {
    reviewNotificationsEnabled: true,
    submissionAlertsEnabled: true,
  },
  "system.banner_draft": {
    title: null,
    message: "",
    severity: "Info",
    startAt: null,
    endAt: null,
  },
};

type SettingsMap = AppSettingsMap;

export type AppSettingKey = keyof SettingsMap;

export const SETTINGS_STORE_UNAVAILABLE_MESSAGE =
  'Settings store unavailable: expose schema "app" in Supabase Data API and ensure app.settings exists with service_role grants.';

const SETTINGS_STORE_UNAVAILABLE_PATTERNS = [
  "pgrst106",
  "invalid schema: app",
  "schema \"app\" does not exist",
  "relation \"app.settings\" does not exist",
  "could not find the table 'app.settings'",
  "permission denied for schema app",
  "permission denied for table settings",
] as const;

let hasLoggedSettingsStoreWarning = false;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function isSettingsStoreUnavailableMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return SETTINGS_STORE_UNAVAILABLE_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

function logSettingsStoreWarning(context: "read" | "write", sourceMessage: string) {
  if (hasLoggedSettingsStoreWarning) return;
  hasLoggedSettingsStoreWarning = true;
  console.warn(
    `[app-settings] ${context} fallback triggered. ${SETTINGS_STORE_UNAVAILABLE_MESSAGE} Source: ${sourceMessage}`
  );
}

export class SettingsStoreUnavailableError extends Error {
  readonly causeMessage: string;

  constructor(causeMessage: string) {
    super(SETTINGS_STORE_UNAVAILABLE_MESSAGE);
    this.name = "SettingsStoreUnavailableError";
    this.causeMessage = causeMessage;
  }
}

export function isSettingsStoreUnavailableError(error: unknown): boolean {
  if (error instanceof SettingsStoreUnavailableError) return true;
  const message = toErrorMessage(error);
  if (!message) return false;
  return (
    message.includes(SETTINGS_STORE_UNAVAILABLE_MESSAGE) ||
    isSettingsStoreUnavailableMessage(message)
  );
}

function cloneDefault<K extends AppSettingKey>(key: K): SettingsMap[K] {
  const value = DEFAULT_SETTINGS[key];
  return structuredClone(value);
}

function safeParseSetting<K extends AppSettingKey>(
  key: K,
  raw: string | null
): SettingsMap[K] {
  if (!raw) return cloneDefault(key);

  try {
    const parsed = JSON.parse(raw) as SettingsMap[K];
    if (parsed === null || parsed === undefined) {
      return cloneDefault(key);
    }
    return parsed;
  } catch {
    return cloneDefault(key);
  }
}

async function readSettingRaw(key: string): Promise<string | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .schema("app")
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    if (isSettingsStoreUnavailableMessage(error.message)) {
      logSettingsStoreWarning("read", error.message);
      return null;
    }
    throw new Error(error.message);
  }

  return typeof data?.value === "string" ? data.value : null;
}

async function writeSettingRaw(key: string, value: string): Promise<void> {
  const admin = supabaseAdmin();
  const { error } = await admin
    .schema("app")
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) {
    if (isSettingsStoreUnavailableMessage(error.message)) {
      logSettingsStoreWarning("write", error.message);
      throw new SettingsStoreUnavailableError(error.message);
    }
    throw new Error(error.message);
  }
}

export async function getTypedAppSetting<K extends AppSettingKey>(
  key: K
): Promise<SettingsMap[K]> {
  const raw = await readSettingRaw(key);
  return safeParseSetting(key, raw);
}

export async function setTypedAppSetting<K extends AppSettingKey>(
  key: K,
  value: SettingsMap[K]
): Promise<SettingsMap[K]> {
  await writeSettingRaw(key, JSON.stringify(value));
  return value;
}

export async function getBlockedUsersSetting(): Promise<BlockedUsersSetting> {
  return getTypedAppSetting("controls.blocked_users");
}

export async function setBlockedUsersSetting(
  next: BlockedUsersSetting
): Promise<BlockedUsersSetting> {
  return setTypedAppSetting("controls.blocked_users", next);
}

export async function setBlockedUser(input: {
  userId: string;
  blockedUntil: string;
  reason: string;
  updatedBy?: string | null;
  updatedAt?: string;
}): Promise<BlockedUsersSetting> {
  const current = await getBlockedUsersSetting();
  const next: BlockedUsersSetting = {
    ...current,
    [input.userId]: {
      blockedUntil: input.blockedUntil,
      reason: input.reason,
      updatedBy: input.updatedBy ?? null,
      updatedAt: input.updatedAt ?? new Date().toISOString(),
    },
  };
  return setBlockedUsersSetting(next);
}

export async function clearBlockedUser(
  userId: string
): Promise<BlockedUsersSetting> {
  const current = await getBlockedUsersSetting();
  const next = { ...current };
  delete next[userId];
  return setBlockedUsersSetting(next);
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  const blocked = await getBlockedUsersSetting();
  const row = blocked[userId];
  if (!row) return false;
  if (!row.blockedUntil) return false;

  const now = new Date().getTime();
  const blockedUntil = new Date(row.blockedUntil).getTime();
  if (!Number.isFinite(blockedUntil)) return false;

  return blockedUntil > now;
}
