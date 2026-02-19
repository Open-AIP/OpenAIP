"use client";

import type {
  ChatHeaderVM,
  LoginGateVM,
} from "@/lib/types/viewmodels";
import {
  ChatBodyRouter,
  ChatConversation,
  ChatHeader,
  ChatNoticeBanner,
  ChatWidgetShell,
  FloatingChatLauncher,
} from "./components";
import { useCitizenChatWidget } from "./hooks/use-citizen-chat-widget";

const HEADER_VM: ChatHeaderVM = {
  title: "OpenAIP AI Assistant",
  subtitle: "Ask about published AIPs and projects",
};

const LOGIN_GATE_VM: LoginGateVM = {
  title: "Login Required",
  description: "Please login to use the OpenAIP AI assistant",
  actionLabel: "Login",
};

export default function CitizenChatWidget() {
  const {
    isOpen,
    setIsOpen,
    authState,
    notice,
    chatbotEnabled,
    errorMessage,
    displayMessages,
    messageCount,
    messageLimit,
    composerVm,
    setComposerText,
    handleSend,
    isSending,
    threadRef,
  } = useCitizenChatWidget();

  return (
    <>
      <ChatWidgetShell isOpen={isOpen}>
        <div className="flex h-full flex-col">
          <ChatHeader vm={HEADER_VM} />
          <ChatNoticeBanner vm={notice} />
          <div className="flex min-h-0 flex-1 flex-col">
            {errorMessage ? (
              <div className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {errorMessage}
              </div>
            ) : null}
            <ChatBodyRouter
              authState={authState}
              chatbotEnabled={chatbotEnabled}
              loginGate={LOGIN_GATE_VM}
            >
              <ChatConversation
                messages={displayMessages}
                messageCount={messageCount}
                messageLimit={messageLimit}
                composer={composerVm}
                onComposerChange={setComposerText}
                onSend={handleSend}
                isSending={isSending}
                threadRef={threadRef}
              />
            </ChatBodyRouter>
          </div>
        </div>
      </ChatWidgetShell>
      <FloatingChatLauncher isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)} />
    </>
  );
}
