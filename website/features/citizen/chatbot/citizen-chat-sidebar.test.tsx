import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CitizenChatSidebar from "./components/citizen-chat-sidebar";

describe("CitizenChatSidebar", () => {
  it("hides search and new-chat controls for anonymous mode", () => {
    render(
      <CitizenChatSidebar
        canManageConversations={false}
        query=""
        sessions={[]}
        onQueryChange={vi.fn()}
        onNewChat={vi.fn()}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /new chat/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search chats/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it("shows search and new-chat controls for authenticated mode", () => {
    render(
      <CitizenChatSidebar
        canManageConversations
        query=""
        sessions={[]}
        onQueryChange={vi.fn()}
        onNewChat={vi.fn()}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /new chat/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search chats/i)).toBeInTheDocument();
  });
});
