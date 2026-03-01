import "server-only";

import type { LoginAttemptStateEntryValue, LoginAttemptStateValue } from "@/lib/settings/app-settings";
import { getTypedAppSetting, setTypedAppSetting } from "@/lib/settings/app-settings";
import type { SecuritySettingsValue } from "@/lib/settings/app-settings";
import { lockoutDurationMs } from "@/lib/security/security-settings.server";

type LoginAttemptStatus = {
  isLocked: boolean;
  failedCount: number;
  lockedUntil: string | null;
};

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

function isFutureIso(value: string | null, nowMs: number): boolean {
  if (!value) return false;
  const target = new Date(value).getTime();
  return Number.isFinite(target) && target > nowMs;
}

function isValidEntry(entry: LoginAttemptStateEntryValue | undefined): entry is LoginAttemptStateEntryValue {
  return Boolean(
    entry &&
      Number.isFinite(entry.failedCount) &&
      entry.failedCount >= 0 &&
      typeof entry.updatedAt === "string"
  );
}

function pruneState(state: LoginAttemptStateValue, nowMs: number): LoginAttemptStateValue {
  const next: LoginAttemptStateValue = {};
  for (const [key, entry] of Object.entries(state)) {
    if (!isValidEntry(entry)) continue;
    if (entry.failedCount <= 0 && !isFutureIso(entry.lockedUntil, nowMs)) continue;
    next[key] = entry;
  }
  return next;
}

function withEntry(
  state: LoginAttemptStateValue,
  emailKey: string,
  updater: (current: LoginAttemptStateEntryValue | null) => LoginAttemptStateEntryValue | null
): LoginAttemptStateValue {
  const current = isValidEntry(state[emailKey]) ? state[emailKey] : null;
  const updated = updater(current);
  const next = { ...state };
  if (!updated) {
    delete next[emailKey];
    return next;
  }
  next[emailKey] = updated;
  return next;
}

export async function getLoginAttemptStatus(input: {
  email: string;
}): Promise<LoginAttemptStatus> {
  const key = normalizeEmailKey(input.email);
  if (!key) return { isLocked: false, failedCount: 0, lockedUntil: null };

  const nowMs = Date.now();
  const state = await getTypedAppSetting("system.login_attempt_state");
  const pruned = pruneState(state, nowMs);
  if (Object.keys(pruned).length !== Object.keys(state).length) {
    await setTypedAppSetting("system.login_attempt_state", pruned).catch(() => undefined);
  }

  const entry = pruned[key];
  if (!entry) return { isLocked: false, failedCount: 0, lockedUntil: null };
  const isLocked = isFutureIso(entry.lockedUntil, nowMs);
  return {
    isLocked,
    failedCount: Math.max(0, entry.failedCount),
    lockedUntil: isLocked ? entry.lockedUntil : null,
  };
}

export async function clearLoginAttemptState(input: { email: string }): Promise<void> {
  const key = normalizeEmailKey(input.email);
  if (!key) return;
  const state = await getTypedAppSetting("system.login_attempt_state");
  if (!(key in state)) return;
  const next = withEntry(state, key, () => null);
  await setTypedAppSetting("system.login_attempt_state", next);
}

export async function recordLoginFailure(input: {
  email: string;
  settings: SecuritySettingsValue;
}): Promise<LoginAttemptStatus> {
  const key = normalizeEmailKey(input.email);
  if (!key) return { isLocked: false, failedCount: 0, lockedUntil: null };

  const nowMs = Date.now();
  const now = nowIso();
  const maxAttempts = Math.max(1, input.settings.loginAttemptLimits.maxAttempts);
  const lockMs = lockoutDurationMs(input.settings.loginAttemptLimits);
  const currentState = await getTypedAppSetting("system.login_attempt_state");
  const state = pruneState(currentState, nowMs);

  const nextState = withEntry(state, key, (current) => {
    if (current && isFutureIso(current.lockedUntil, nowMs)) {
      return {
        ...current,
        updatedAt: now,
        lastFailedAt: now,
      };
    }

    const failedCount = (current?.failedCount ?? 0) + 1;
    const shouldLock = failedCount >= maxAttempts;
    return {
      failedCount: shouldLock ? 0 : failedCount,
      firstFailedAt: current?.firstFailedAt ?? now,
      lastFailedAt: now,
      lockedUntil: shouldLock ? new Date(nowMs + lockMs).toISOString() : null,
      updatedAt: now,
    };
  });

  await setTypedAppSetting("system.login_attempt_state", nextState);
  const updated = nextState[key];
  if (!updated) return { isLocked: false, failedCount: 0, lockedUntil: null };

  const isLocked = isFutureIso(updated.lockedUntil, nowMs);
  return {
    isLocked,
    failedCount: Math.max(0, updated.failedCount),
    lockedUntil: isLocked ? updated.lockedUntil : null,
  };
}

