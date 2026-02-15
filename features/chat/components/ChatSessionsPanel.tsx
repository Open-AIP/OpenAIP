"use client";

import { Search, Plus } from "lucide-react";
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="text-base font-semibold text-slate-900">Conversations</div>
        <Button className="h-9 gap-2 rounded-lg bg-[#0f5b66] px-3 text-xs hover:bg-[#0f5b66]/90" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search chats"
            className="h-10 border-slate-200 bg-slate-50 pl-9 text-[13.5px]"
          />
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={cn(
              "w-full border-l-2 px-5 py-4 text-left transition-colors",
              session.isActive
                ? "border-[#0f5b66] bg-slate-50"
                : "border-transparent hover:bg-slate-50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {session.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {session.snippet}
                </div>
              </div>
              <div className="text-[11px] text-slate-400">{session.timeLabel}</div>
            </div>
          </button>
        ))}
        {!sessions.length && (
          <div className="px-5 pb-6 text-sm text-slate-500">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  );
}
