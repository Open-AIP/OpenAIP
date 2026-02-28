import { redirect } from "next/navigation";
import { CitizenChatbotView } from "@/features/citizen/chatbot";
import {
  getCitizenProfileByUserId,
  isCitizenProfileComplete,
} from "@/lib/auth/citizen-profile-completion";
import { supabaseServer } from "@/lib/supabase/server";

type CitizenAiAssistantPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ROUTE_PATH = "/ai-assistant";

function toSingle(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

function toSearchParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(input)) {
    const value = toSingle(rawValue);
    if (value !== null) {
      params.set(key, value);
    }
  }
  return params;
}

function buildCleanReturnPath(params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString());
  next.delete("auth");
  next.delete("authStep");
  next.delete("next");
  next.delete("returnTo");
  next.delete("completeProfile");
  const query = next.toString();
  return query ? `${ROUTE_PATH}?${query}` : ROUTE_PATH;
}

function buildAuthRedirectHref(params: URLSearchParams, returnTo: string): string {
  const next = new URLSearchParams(params.toString());
  next.set("auth", "login");
  next.set("authStep", "email");
  next.delete("completeProfile");
  next.set("next", returnTo);
  next.set("returnTo", returnTo);
  const query = next.toString();
  return query ? `${ROUTE_PATH}?${query}` : ROUTE_PATH;
}

function buildCompleteProfileRedirectHref(params: URLSearchParams, returnTo: string): string {
  const next = new URLSearchParams(params.toString());
  next.delete("auth");
  next.delete("authStep");
  next.set("completeProfile", "1");
  next.set("next", returnTo);
  next.set("returnTo", returnTo);
  const query = next.toString();
  return query ? `${ROUTE_PATH}?${query}` : ROUTE_PATH;
}

function AccessBlockedNotice({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <p className="max-w-xl text-sm text-slate-600">{message}</p>
    </div>
  );
}

const CitizenAiAssistantPage = async ({ searchParams }: CitizenAiAssistantPageProps) => {
  const resolvedSearchParams = await searchParams;
  const params = toSearchParams(resolvedSearchParams);
  const cleanReturnTo = buildCleanReturnPath(params);

  const client = await supabaseServer();
  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authError ? null : authData.user?.id ?? null;

  if (!userId) {
    if (params.get("auth") !== "login" && params.get("auth") !== "signup") {
      redirect(buildAuthRedirectHref(params, cleanReturnTo));
    }

    return (
      <AccessBlockedNotice message="Sign in to use the AI Assistant. The sign-in modal should open automatically." />
    );
  }

  const profile = await getCitizenProfileByUserId(client, userId);
  const profileComplete = isCitizenProfileComplete(profile);

  if (!profileComplete) {
    if (params.get("completeProfile") !== "1") {
      redirect(buildCompleteProfileRedirectHref(params, cleanReturnTo));
    }

    return (
      <AccessBlockedNotice message="Complete your profile to continue using the AI Assistant. The profile completion modal should open automatically." />
    );
  }

  if (
    params.has("auth") ||
    params.has("authStep") ||
    params.has("next") ||
    params.has("returnTo") ||
    params.has("completeProfile")
  ) {
    redirect(cleanReturnTo);
  }

  return (
    <div className="h-full min-h-0">
      <CitizenChatbotView />
    </div>
  );
};

export default CitizenAiAssistantPage;
