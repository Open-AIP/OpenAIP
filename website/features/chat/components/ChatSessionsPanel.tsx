"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/ui/utils";
import type { ChatSessionListItem } from "../types/chat.types";

export default function ChatSessionsPanel({
  sessions,
  query,
  onQueryChange,
  onSelect,
  onNewChat,
}: {
  sessions: ChatSessionListItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <div className="text-base font-semibold">Conversations</div>
        <Button className="h-9 gap-2 rounded-lg px-3 text-xs" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="shrink-0 p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search chats"
            className="h-10 pl-9 text-[13.5px]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={cn(
              "w-full border-l-2 px-5 py-4 text-left transition-colors",
              session.isActive ? "border-primary bg-muted/50" : "border-transparent hover:bg-muted/50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{session.title}</div>
                <div className="text-muted-foreground mt-1 text-xs">{session.snippet}</div>
              </div>
              <div className="text-muted-foreground text-[11px]">{session.timeLabel}</div>
            </div>
          </button>
        ))}

        {!sessions.length && (
          <div className="text-muted-foreground px-5 pb-6 text-sm">No conversations found.</div>
        )}
      </div>
    </div>
  );
}
