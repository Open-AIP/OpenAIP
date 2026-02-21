import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function BarangayChatbot() {
  const user = await getUser();

  return <LguChatbotView userId={user.userId} />;
}