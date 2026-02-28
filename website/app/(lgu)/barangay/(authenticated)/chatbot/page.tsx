import { LguChatbotView } from "@/features/chat";
import { getUser } from "@/lib/actions/auth.actions";

export default async function BarangayChatbot() {
  await getUser();
  return (
    <div className="h-[calc(100vh-7rem)] min-h-0">
      <LguChatbotView />
    </div>
  );
}
