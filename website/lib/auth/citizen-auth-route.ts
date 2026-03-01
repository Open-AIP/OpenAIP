import { NextResponse } from "next/server";

export type AuthRouteSuccessPayload = Record<string, unknown>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeWhitespace(value).toLowerCase();
  if (!normalized || !EMAIL_REGEX.test(normalized)) return null;
  return normalized;
}

export function normalizePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized;
}

export function normalizeOtpToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return null;
  return normalized;
}

export function toSiteUrl(request: Request): string {
  const baseUrl = process.env.BASE_URL?.trim();
  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }
  return new URL(request.url).origin;
}

export function mapSupabaseAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("user already registered")) {
    return "Account already exists. Please sign in instead.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please verify your email using the OTP code.";
  }
  if (normalized.includes("expired")) {
    return "The verification code has expired. Request a new code and try again.";
  }
  if (
    (normalized.includes("token") && normalized.includes("invalid")) ||
    normalized.includes("invalid otp")
  ) {
    return "Invalid verification code. Please try again.";
  }
  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("security purposes") ||
    normalized.includes("request this after")
  ) {
    return "Too many attempts. Please wait and try again.";
  }

  return message;
}

export function ok(payload: AuthRouteSuccessPayload = {}, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: { message },
    },
    { status }
  );
}
