import type { ReactNode } from "react";
import type { ChatAuthState, LoginGateVM } from "@/lib/types/viewmodels";
import LoginGateCard from "./LoginGateCard";

export default function ChatBodyRouter({
  authState,
  chatbotEnabled,
  loginGate,
  children,
}: {
  authState: ChatAuthState;
  chatbotEnabled: boolean;
  loginGate: LoginGateVM;
  children: ReactNode;
}) {
  if (authState === "loading") {
    return <div className="flex flex-1 items-center justify-center text-xs text-slate-500">Loading...</div>;
  }

  if (!chatbotEnabled) {
    return <div className="flex flex-1 items-center justify-center text-xs text-slate-500">Chatbot is currently disabled.</div>;
  }

  if (authState === "logged_out") {
    return <LoginGateCard vm={loginGate} />;
  }

  return <>{children}</>;
}
