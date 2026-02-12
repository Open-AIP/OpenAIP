"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FeedbackComposer from "@/features/citizen/aips/components/FeedbackComposer";
import FeedbackList from "@/features/citizen/aips/components/FeedbackList";
import type { FeedbackItem, FeedbackUser } from "@/features/citizen/aips/types";

type Props = {
  aipId: string;
  items: FeedbackItem[];
  isAuthenticated: boolean;
  currentUser?: FeedbackUser | null;
};

export default function AipFeedbackTab({
  aipId,
  items,
  isAuthenticated,
  currentUser,
}: Props) {
  return (
    <div className="space-y-6">
      {isAuthenticated ? (
        <FeedbackComposer
          aipId={aipId}
          currentUser={currentUser ?? { name: "Citizen", barangayName: "Barangay" }}
        />
      ) : (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900">Login Required</p>
              <p className="mt-1 text-sm text-slate-600">Please login to add feedback</p>
            </div>
            <Button asChild className="mt-2 bg-[#0E7490] text-white hover:bg-[#0C6078]">
              <Link href="/sign-in">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <FeedbackList items={items} showSort={isAuthenticated} />
    </div>
  );
}
