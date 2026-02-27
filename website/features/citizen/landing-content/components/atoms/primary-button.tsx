import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";

type PrimaryButtonProps = {
  label: string;
  href?: string;
  actionKey?: string;
  className?: string;
  ariaLabel?: string;
};

export default function PrimaryButton({
  label,
  href,
  actionKey,
  className,
  ariaLabel,
}: PrimaryButtonProps) {
  if (href) {
    return (
      <Button
        asChild
        className={cn(
          "rounded-full bg-powderblue px-6 text-[#001925] hover:bg-powderblue/90 focus-visible:ring-2 focus-visible:ring-[#67E8F9]",
          className
        )}
      >
        <Link href={href} aria-label={ariaLabel ?? label}>
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      aria-label={ariaLabel ?? label}
      data-action-key={actionKey}
      className={cn(
        "rounded-full bg-powderblue px-6 text-[#001925] hover:bg-powderblue/90 focus-visible:ring-2 focus-visible:ring-[#67E8F9]",
        className
      )}
    >
      {label}
    </Button>
  );
}

