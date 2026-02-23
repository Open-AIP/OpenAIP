import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_EXPLAINER =
  "Budget allocation shows how public funds are distributed across service categories for specific programs in the selected fiscal year. It helps citizens understand which sectors receive priority funding and how projects are assigned to programs and infrastructure.";

type ExplainerSectionProps = {
  title: string;
  body?: string;
};

export default function ExplainerSection({ title, body = DEFAULT_EXPLAINER }: ExplainerSectionProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-3 p-6">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-600">{body}</p>
      </CardContent>
    </Card>
  );
}
