import { BookOpen, CircleAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AipIntroCard() {
  return (
    <Card className="border border-[#bfd8f7] bg-white">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 text-[#2e6fa9]" />
          <div>
            <h2 className="text-3xl font-semibold text-[#103655]">What is an Annual Investment Plan?</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-700">
              The AIP is your local government&apos;s official roadmap for the year. It lists planned programs,
              projects, and activities, together with their approved budgets.
            </p>
            <p className="text-lg leading-relaxed text-slate-700">
              This page allows citizens to review the full document, understand budget priorities, and see how public
              funds are intended to benefit the community.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-[#f3e8c6] bg-[#fff6e6] px-3 py-2 text-sm text-[#6f5a1b]">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4" />
            <p>
              Click &quot;View Details&quot; on any AIP to see the complete breakdown of projects, budgets, timelines, and
              implementation strategies.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
