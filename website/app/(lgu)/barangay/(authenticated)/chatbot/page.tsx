import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function BarangayChatbot() {
  await getUser();
  return <LguChatbotView />;
}
