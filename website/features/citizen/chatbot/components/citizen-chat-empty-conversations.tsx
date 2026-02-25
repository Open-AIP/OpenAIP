import { MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CitizenChatEmptyConversations({
  onNewChat,
}: {
  onNewChat: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <MessageSquareMore className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm font-medium text-slate-700">No conversations yet</p>
      <p className="mt-1 text-xs text-slate-500">Start your first chat to ask about published AIP documents.</p>
      <Button className="mt-4 h-9 bg-[#022437] text-white hover:bg-[#011c2a]" onClick={onNewChat}>
        Start New Chat
      </Button>
    </div>
  );
}
