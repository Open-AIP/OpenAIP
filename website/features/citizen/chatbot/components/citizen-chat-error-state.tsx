import { AlertTriangle, FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CitizenChatErrorState } from "../types/citizen-chatbot.types";

const COPY: Record<Exclude<CitizenChatErrorState, "none">, { title: string; body: string; icon: "alert" | "file" }> = {
  no_published_aip: {
    title: "No published AIP found",
    body: "I could not find published AIP records for your scope. Try changing fiscal year or ask a broader question.",
    icon: "file",
  },
  retrieval_failed: {
    title: "Unable to retrieve response",
    body: "The assistant could not complete retrieval. Please try again.",
    icon: "alert",
  },
};

export default function CitizenChatErrorState({
  state,
  message,
  onRetry,
}: {
  state: Exclude<CitizenChatErrorState, "none">;
  message: string | null;
  onRetry?: () => void;
}) {
  const content = COPY[state];
  const Icon = content.icon === "file" ? FileX2 : AlertTriangle;

  return (
    <div className="rounded-xl bg-rose-50/70 p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-rose-600" />
        <div>
          <h3 className="text-sm font-semibold text-rose-900">{content.title}</h3>
          <p className="mt-1 text-sm text-rose-800">{message ?? content.body}</p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-8 border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
              onClick={onRetry}
            >
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
