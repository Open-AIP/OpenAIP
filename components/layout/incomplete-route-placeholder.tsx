import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IncompleteRoutePlaceholder({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {ctaHref && ctaLabel ? (
        <CardContent>
          <Button asChild variant="outline">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

