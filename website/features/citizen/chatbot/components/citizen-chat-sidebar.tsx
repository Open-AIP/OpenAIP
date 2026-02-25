import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CitizenChatEmptyConversations from "./citizen-chat-empty-conversations";
import CitizenChatSessionItem from "./citizen-chat-session-item";
import type { CitizenChatSessionVM } from "../types/citizen-chatbot.types";

export default function CitizenChatSidebar({
  query,
  sessions,
  onQueryChange,
  onNewChat,
  onSelectSession,
}: {
  query: string;
  sessions: CitizenChatSessionVM[];
  onQueryChange: (value: string) => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Conversations</h2>
          <Button className="h-10 gap-2 rounded-xl bg-[#022437] px-4 text-white hover:bg-[#011c2a]" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search chats"
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:ring-[#022437]/30"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sessions.length ? (
          sessions.map((session) => (
            <CitizenChatSessionItem
              key={session.id}
              session={session}
              onSelect={onSelectSession}
            />
          ))
        ) : (
          <div className="p-4">
            <CitizenChatEmptyConversations onNewChat={onNewChat} />
          </div>
        )}
      </div>
    </aside>
  );
}
