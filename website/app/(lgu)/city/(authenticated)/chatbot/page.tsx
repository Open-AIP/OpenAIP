import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function CityChatbot() {
  const user = await getUser();

  return <LguChatbotView userId={user.userId} />;
}