"use client";

import { useState } from "react";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FeedbackCategory, FeedbackUser } from "@/features/citizen/aips/types";

type Props = {
  aipId: string;
  currentUser: FeedbackUser;
};

const CATEGORY_OPTIONS: FeedbackCategory[] = [
  "Question",
  "Concern",
  "Suggestion",
  "Commendation",
];

export default function FeedbackComposer({ aipId, currentUser }: Props) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "">("");

  const canSubmit = message.trim().length > 0 && category !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    console.log({
      aipId,
      message: message.trim(),
      category,
    });
    setMessage("");
    setCategory("");
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-4 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
            <span className="mt-1 inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
              {currentUser.barangayName}
            </span>
          </div>
        </div>

        <Textarea
          placeholder="Write your feedback here..."
          className="min-h-[120px] bg-white"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Category</p>
          <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory)}>
            <SelectTrigger className="h-10 bg-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#0E7490] text-white hover:bg-[#0C6078]"
          >
            <Send className="h-4 w-4" />
            Submit Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
