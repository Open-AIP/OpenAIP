export type ChatAuthState = "logged_out" | "logged_in" | "loading";

export type ChatScopeVM = {
  scopeType: "city" | "barangay";
  scopeId: string;
  fiscalYear: number;
  label: string;
};

export type ChatWidgetStateVM = {
  isOpen: boolean;
  authState: ChatAuthState;
  activeSessionId?: string | null;
  selectedScope: ChatScopeVM;
  messageCount: number;
  messageLimit: number;
};

export type ChatHeaderVM = {
  title: string;
  subtitle: string;
};

export type ChatNoticeVM = {
  text: string;
  tone: "warning" | "info";
};

export type ChatMessageVM = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestampDisplay: string;
  status: "sent" | "pending" | "error";
};

export type ChatComposerVM = {
  inputText: string;
  canSend: boolean;
  placeholder: string;
};

export type LoginGateVM = {
  title: string;
  description: string;
  actionLabel: string;
};
