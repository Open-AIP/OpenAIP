import type { ChatHeaderVM } from "@/lib/types/viewmodels";

export default function ChatHeader({ vm }: { vm: ChatHeaderVM }) {
  return (
    <div className="bg-[#0b5164] px-5 py-4 text-white">
      <div className="text-sm font-semibold">{vm.title}</div>
      <div className="text-xs text-white/70">{vm.subtitle}</div>
    </div>
  );
}
