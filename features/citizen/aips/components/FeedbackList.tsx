"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FeedbackListItem from "@/features/citizen/aips/components/FeedbackListItem";
import type { FeedbackItem } from "@/features/citizen/aips/types";

type Props = {
  items: FeedbackItem[];
  showSort?: boolean;
};

export default function FeedbackList({ items, showSort = false }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">Feedback ({items.length})</h3>
        {showSort ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                Most recent
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Most recent</DropdownMenuItem>
              <DropdownMenuItem>Oldest</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <FeedbackListItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
