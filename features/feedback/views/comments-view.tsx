"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { CommentThreadListCard } from "../components/comment-thread-list-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatFeedbackKind,
  getFeedbackKindBadge,
} from "@/lib/constants/feedback-kind";
import type { LguScopeKind } from "@/lib/auth/scope";
import { useCommentsView } from "../hooks/use-comments-view";

export default function CommentsView({
  scope = "barangay",
  lguId = null,
}: {
  scope?: LguScopeKind;
  lguId?: string | null;
} = {}) {
  const {
    categoryKinds,
    loading,
    error,
    year,
    setYear,
    status,
    setStatus,
    context,
    setContext,
    category,
    setCategory,
    query,
    setQuery,
    yearOptions,
    contextOptions,
    filteredItems,
    threadMap,
  } = useCommentsView({ scope, lguId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feedback</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review citizen feedback and respond to feedback related to published
          AIPs and projects.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Year</div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Project</div>
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {contextOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Status</div>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as "all" | "no_response" | "responded")
              }
            >
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="no_response">No response</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Category</div>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as "all" | (typeof categoryKinds)[number])
              }
            >
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categoryKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {formatFeedbackKind(kind)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-xs text-slate-500">Search</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by commenter name, comment, or project..."
              className="h-11 border-slate-200 bg-slate-50 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="text-sm text-slate-500">Loading inbox...</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : (
          <>
            <div className="text-sm text-slate-500">Showing Feedback</div>

            <div className="space-y-5">
                {filteredItems.map((item) => {
                  const thread = threadMap.get(item.threadId);
                  const authorName = thread?.preview.authorName ?? "Citizen";
                  const authorScopeLabel = thread?.preview.authorScopeLabel ?? null;
                  const kind = thread?.preview.kind ?? "question";
                  const badge = getFeedbackKindBadge(kind);

                  return (
                    <Link key={item.threadId} href={item.href} className="block">
                      <CommentThreadListCard
                        authorName={authorName}
                        authorScopeLabel={authorScopeLabel}
                        updatedAt={item.updatedAt}
                        contextTitle={item.contextTitle}
                        contextSubtitle={item.contextSubtitle}
                        snippet={item.snippet}
                        status={item.status}
                        badgeLabel={badge.label}
                        badgeClassName={badge.className}
                      />
                    </Link>
                  );
                })}
              </div>
            </>
        )}
      </div>
    </div>
  );
}
