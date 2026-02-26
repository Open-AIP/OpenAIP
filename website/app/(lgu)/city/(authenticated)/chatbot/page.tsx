import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function CityChatbot() {
  await getUser();
  return (
    <div className="h-[calc(100vh-7rem)] min-h-0">
      <LguChatbotView routePrefix="/api/city/chat" />
    </div>
  );
}
