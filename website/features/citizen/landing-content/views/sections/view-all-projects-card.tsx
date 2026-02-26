import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/ui/utils";

type ViewAllProjectsCardProps = {
  title: string;
  href: string;
  actionLabel: string;
  className?: string;
  titleClassName?: string;
  actionClassName?: string;
  interactive?: boolean;
};

export default function ViewAllProjectsCard({
  title,
  href,
  actionLabel,
  className,
  titleClassName,
  actionClassName,
  interactive = true,
}: ViewAllProjectsCardProps) {
  const cardClassName = cn(
    "h-[494px] w-[400px] rounded-2xl border border-dashed border-slate-300 bg-white/95 p-8 shadow-sm transition-transform duration-200",
    interactive && "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67E8F9]",
    className
  );

  const content = (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <p className={cn("max-w-[14ch] text-3xl font-bold leading-tight text-[#0C2C3A]", titleClassName)}>{title}</p>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-[#EC4899] px-5 py-2 text-sm font-semibold text-white",
          actionClassName
        )}
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </span>
    </div>
  );

  if (!interactive) {
    return <article className={cardClassName}>{content}</article>;
  }

  return (
    <Link href={href} className={cn("block", cardClassName)} aria-label={title}>
      {content}
    </Link>
  );
}
