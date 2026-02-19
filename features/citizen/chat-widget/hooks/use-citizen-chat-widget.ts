"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getChatRepo } from "@/lib/repos/chat/repo";
import type { ChatMessage } from "@/lib/repos/chat/repo";
import { createMockChatRepo } from "@/lib/repos/chat/repo.mock";
import { getUsageControlsRepo } from "@/lib/repos/usage-controls/repo";
import { createMockUsageControlsRepo } from "@/lib/repos/usage-controls/repo.mock";
import { getCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard";
import { createMockCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard/repo.mock";
import type { CitizenDashboardFilters } from "@/lib/repos/citizen-dashboard";
import type {
  ChatAuthState,
  ChatComposerVM,
  ChatMessageVM,
  ChatNoticeVM,
  ChatScopeVM,
} from "@/lib/types/viewmodels";
import {
  buildAssistantStubReply,
  buildScopeLabel,
  defaultScopeVM,
  formatTime,
  readScopeFromUrl,
  toScopeVM,
} from "../utils";

const DEFAULT_NOTICE = "This assistant uses published AIP and project data only.";

const GREETING_MESSAGE: ChatMessageVM = {
  id: "assistant_greeting",
  role: "assistant",
  content: "Hi! Ask me about published AIPs, budgets, or projects.",
  timestampDisplay: "",
  status: "sent",
};

const DEFAULT_MESSAGE_LIMIT = 10;

export function useCitizenChatWidget() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const chatRepo = useMemo(() => {
    try {
      return getChatRepo();
    } catch {
      return createMockChatRepo();
    }
  }, []);
  const usageRepo = useMemo(() => {
    try {
      return getUsageControlsRepo();
    } catch {
      return createMockUsageControlsRepo();
    }
  }, []);
  const dashboardRepo = useMemo(() => {
    try {
      return getCitizenDashboardRepo();
    } catch {
      return createMockCitizenDashboardRepo();
    }
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState<ChatAuthState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [messageLimit, setMessageLimit] = useState(DEFAULT_MESSAGE_LIMIT);
  const [notice, setNotice] = useState<ChatNoticeVM>({ text: DEFAULT_NOTICE, tone: "info" });
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [selectedScope, setSelectedScope] = useState<ChatScopeVM>(defaultScopeVM());
  const [composerText, setComposerText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const scopeKey = `${selectedScope.scopeType}:${selectedScope.scopeId}:${selectedScope.fiscalYear}`;

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        const sessionUserId = data.session?.user.id ?? null;
        setUserId(sessionUserId);
        setAuthState(sessionUserId ? "logged_in" : "logged_out");
      } catch {
        if (!active) return;
        setUserId(null);
        setAuthState("logged_out");
      }
    }

    loadAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUserId = session?.user.id ?? null;
      setUserId(sessionUserId);
      setAuthState(sessionUserId ? "logged_in" : "logged_out");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadPolicies() {
      try {
        const [rateLimit, systemPolicy] = await Promise.all([
          usageRepo.getChatbotRateLimitPolicy(),
          usageRepo.getChatbotSystemPolicy(),
        ]);

        if (!active) return;
        setMessageLimit(rateLimit.maxRequests > 0 ? rateLimit.maxRequests : DEFAULT_MESSAGE_LIMIT);
        setNotice({
          text: systemPolicy.userDisclaimer || DEFAULT_NOTICE,
          tone: systemPolicy.isEnabled ? "info" : "warning",
        });
        setChatbotEnabled(systemPolicy.isEnabled);
      } catch {
        if (!active) return;
        setMessageLimit(DEFAULT_MESSAGE_LIMIT);
        setNotice({ text: DEFAULT_NOTICE, tone: "info" });
        setChatbotEnabled(true);
      }
    }

    loadPolicies();

    return () => {
      active = false;
    };
  }, [usageRepo]);

  useEffect(() => {
    let active = true;

    async function resolveScope() {
      const urlFilters = readScopeFromUrl(new URLSearchParams(searchParams.toString()));
      const filters: CitizenDashboardFilters = {
        scope_type: urlFilters.scope_type,
        scope_id: urlFilters.scope_id,
        fiscal_year: urlFilters.fiscal_year,
        search: urlFilters.search,
      };

      try {
        const dashboard = await dashboardRepo.getDashboard(filters);
        if (!active) return;

        const label = buildScopeLabel(
          dashboard.resolvedFilters.scope_type,
          dashboard.resolvedFilters.scope_id,
          dashboard.activeCities,
          dashboard.activeBarangays
        );

        setSelectedScope(
          toScopeVM({
            scopeType: dashboard.resolvedFilters.scope_type,
            scopeId: dashboard.resolvedFilters.scope_id,
            fiscalYear: dashboard.resolvedFilters.fiscal_year,
            label,
          })
        );
      } catch {
        if (!active) return;
        setSelectedScope((prev) => ({
          ...prev,
          scopeType: urlFilters.scope_type,
          scopeId: urlFilters.scope_id,
          fiscalYear: urlFilters.fiscal_year,
        }));
      }
    }

    resolveScope();

    return () => {
      active = false;
    };
  }, [dashboardRepo, searchParams]);

  useEffect(() => {
    let active = true;

    async function initSession() {
      if (!isOpen) {
        return;
      }

      if (authState !== "logged_in" || !userId) {
        setActiveSessionId(null);
        setMessages([]);
        return;
      }

      try {
        const session = await chatRepo.createSession(userId, {
          context: {
            scope_type: selectedScope.scopeType,
            scope_id: selectedScope.scopeId,
            fiscal_year: selectedScope.fiscalYear,
            page: "citizen",
          },
        });

        if (!active) return;
        setActiveSessionId(session.id);
        setMessages([]);
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to start chat session.");
      }
    }

    initSession();

    return () => {
      active = false;
    };
  }, [authState, chatRepo, isOpen, scopeKey, userId, selectedScope.scopeType, selectedScope.scopeId, selectedScope.fiscalYear]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, isOpen]);

  const messageCount = messages.filter((message) => message.role === "user").length;

  const composerVm: ChatComposerVM = {
    inputText: composerText,
    canSend: Boolean(composerText.trim()) && messageCount < messageLimit && chatbotEnabled,
    placeholder: "Type your question...",
  };

  const displayMessages = messages.length === 0 ? [GREETING_MESSAGE] : messages;

  const handleSend = async () => {
    if (!composerVm.canSend || isSending) return;
    if (!activeSessionId || !userId) return;

    const content = composerText.trim();
    if (!content) return;

    setIsSending(true);
    setErrorMessage(null);
    setComposerText("");

    try {
      const userMessage = await chatRepo.appendUserMessage(activeSessionId, content);
      const mappedUserMessage: ChatMessageVM = {
        id: userMessage.id,
        role: "user",
        content: userMessage.content,
        timestampDisplay: formatTime(userMessage.createdAt),
        status: "sent",
      };

      setMessages((prev) => [...prev, mappedUserMessage]);

      const reply = await new Promise<ChatMessage>((resolve) => {
        setTimeout(() => {
          resolve({
            id: `assistant_${Date.now()}`,
            sessionId: activeSessionId,
            role: "assistant",
            content: buildAssistantStubReply(content),
            createdAt: new Date().toISOString(),
          });
        }, 500);
      });

      setMessages((prev) => [
        ...prev,
        {
          id: reply.id,
          role: "assistant",
          content: reply.content,
          timestampDisplay: formatTime(reply.createdAt),
          status: "sent",
        },
      ]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return {
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
  };
}
