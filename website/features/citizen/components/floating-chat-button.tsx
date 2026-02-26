'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingChatButton() {
  return (
    <Button
      type="button"
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#0E7490] text-white shadow-lg hover:bg-[#0C6078]"
      onClick={() => {
        console.log('Chat clicked');
      }}
      aria-label="Open chatbot"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">Open chat</span>
    </Button>
  );
}
