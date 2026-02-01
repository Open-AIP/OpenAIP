"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { CommentCard } from "../components/comment-card";
import {
  createMockCommentTargetLookup,
  getCommentRepo,
  resolveCommentSidebar,
} from "../services";
import type { CommentSidebarItem, CommentThread } from "../types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CommentsView() {
  const repo = useMemo(() => getCommentRepo(), []);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [items, setItems] = useState<CommentSidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState<"all" | "no_response" | "responded">(
    "all"
  );
  const [context, setContext] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadThreads() {
      setLoading(true);
      setError(null);

      try {
        const threadList = await repo.listThreadsForInbox({
          lguId: "lgu_barangay_001",
        });
        const lookup = createMockCommentTargetLookup();
        const resolved = await resolveCommentSidebar({
          threads: threadList,
          scope: "barangay",
          ...lookup,
        });

        if (!isActive) return;
        setThreads(threadList);
        setItems(resolved);
      } catch (err) {
        if (!isActive) return;
        setError(
          err instanceof Error ? err.message : "Failed to load feedback."
        );
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadThreads();

    return () => {
      isActive = false;
    };
  }, [repo]);

  const threadMap = useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads]
  );

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    items.forEach((item) => {
      const yearValue = new Date(item.updatedAt).getFullYear();
      if (!Number.isNaN(yearValue)) set.add(yearValue);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const contextOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.contextTitle));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (context !== "all" && item.contextTitle !== context) return false;

      if (year !== "all") {
        const itemYear = new Date(item.updatedAt).getFullYear();
        if (Number.isNaN(itemYear) || itemYear !== Number(year)) return false;
      }

      if (!query.trim()) return true;

      const thread = threadMap.get(item.threadId);
      const haystack = [
        item.snippet,
        item.contextTitle,
        item.contextSubtitle,
        thread?.preview.authorName,
        thread?.preview.authorScopeLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query.trim().toLowerCase());
    });
  }, [items, status, context, year, query, threadMap]);

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
        <div className="grid gap-4 lg:grid-cols-3">
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
                const projectLabel = `${item.contextTitle} - ${item.contextSubtitle}`;

                return (
                  <Link key={item.threadId} href={item.href} className="block">
                    <CommentCard
                      commenterName={thread?.preview.authorName ?? "Citizen"}
                      barangayName={thread?.preview.authorScopeLabel ?? null}
                      createdAt={item.updatedAt}
                      projectLabel={projectLabel}
                      comment={item.snippet}
                      status={item.status}
                      showActions={false}
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
