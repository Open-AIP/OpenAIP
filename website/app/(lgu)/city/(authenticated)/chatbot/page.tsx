import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function CityChatbot() {
  await getUser();
  return <LguChatbotView routePrefix="/api/city/chat" />;
}
