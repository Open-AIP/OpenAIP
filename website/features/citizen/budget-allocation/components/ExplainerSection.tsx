import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_EXPLAINER =
  "Budget allocation shows how public funds are distributed across service categories for specific programs in the selected fiscal year. It helps citizens understand which sectors receive priority funding and how projects are assigned to programs and infrastructure.";

type ExplainerSectionProps = {
  title: string;
  body?: string;
};

export default function ExplainerSection({ title, body = DEFAULT_EXPLAINER }: ExplainerSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-6 md:p-7">
          <h2 className="text-lg font-semibold text-[#022437]">{title}</h2>
          <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">{body}</p>
        </CardContent>
      </Card>
    </section>
  );
}
