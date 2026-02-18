import { cn } from "@/ui/utils";

export default function MessageLimitIndicator({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  const reached = count >= limit;

  return (
    <div
      className={cn(
        "px-4 pt-2 text-[11px]",
        reached ? "text-rose-500" : "text-slate-400"
      )}
    >
      {count}/{limit} messages
    </div>
  );
}
