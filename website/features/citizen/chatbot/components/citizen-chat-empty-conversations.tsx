import { MessageSquareMore } from "lucide-react";

export default function CitizenChatEmptyConversations({ anonymous = false }: { anonymous?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-6 text-center">
      <MessageSquareMore className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm font-medium text-slate-700">No conversations yet</p>
      <p className="mt-1 text-xs text-slate-500">
        {anonymous
          ? "Sign in to create and view your conversations."
          : "Start your first chat to ask about published AIP documents."}
      </p>
    </div>
  );
}
