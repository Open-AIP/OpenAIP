import type { ChatNoticeVM } from "@/lib/types/viewmodels";
import { cn } from "@/ui/utils";

export default function ChatNoticeBanner({ vm }: { vm: ChatNoticeVM }) {
  return (
    <div
      className={cn(
        "mx-4 mt-4 rounded-lg border px-3 py-2 text-[11px]",
        vm.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      )}
    >
      {vm.text}
    </div>
  );
}
