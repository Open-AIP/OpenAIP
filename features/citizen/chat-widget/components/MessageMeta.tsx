import { cn } from "@/ui/utils";

export default function MessageMeta({
  label,
  align,
}: {
  label: string;
  align: "left" | "right";
}) {
  return (
    <div className={cn("mt-2 text-[10px]", align === "right" ? "text-white/70" : "text-slate-400")}>
      {label}
    </div>
  );
}
