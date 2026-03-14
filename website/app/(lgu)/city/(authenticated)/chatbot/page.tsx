import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function CityChatbot() {
  await getUser();
  return (
    <div className="h-[calc(100dvh-7rem)] min-h-0 md:h-[calc(100vh-7rem)]">
      <LguChatbotView routePrefix="/api/city/chat" />
    </div>
  );
}
