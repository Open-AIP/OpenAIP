import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingChatLauncher({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#0E7490] text-white shadow-lg hover:bg-[#0C6078]"
      onClick={onToggle}
      aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      <span className="sr-only">{isOpen ? "Close chat" : "Open chat"}</span>
    </Button>
  );
}
