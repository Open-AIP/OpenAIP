import type { ChatMessage, ChatSession } from "@/lib/repos/chat/repo";
import type { ChatMessageBubble, ChatSessionListItem } from "@/lib/types/viewmodels/chat.vm";

const truncate = (value: string, max = 44) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

export const formatChatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const deriveSessionTitle = (session: ChatSession, messages: ChatMessage[]) => {
  if (session.title) return session.title;
  const firstUser = messages.find((message) => message.role === "user");
  if (firstUser?.content) return truncate(firstUser.content, 32);
  return "New Chat";
};

export const deriveSessionSnippet = (messages: ChatMessage[]) => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return "No messages yet.";
  return truncate(lastMessage.content, 56);
};

export const mapSessionToListItem = (input: {
  session: ChatSession;
  messages: ChatMessage[];
  isActive: boolean;
}): ChatSessionListItem => {
  const { session, messages, isActive } = input;
  const lastMessage = messages[messages.length - 1];

  return {
    id: session.id,
    title: deriveSessionTitle(session, messages),
    snippet: deriveSessionSnippet(messages),
    timeLabel: lastMessage?.createdAt
      ? formatChatTime(lastMessage.createdAt)
      : "—",
    isActive,
  };
};

export const mapMessageToBubble = (message: ChatMessage): ChatMessageBubble => ({
  id: message.id,
  role: message.role,
  content: message.content,
  timeLabel: formatChatTime(message.createdAt),
});
