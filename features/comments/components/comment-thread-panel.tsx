"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCommentDate } from "../lib/format";
import { getCommentRepo } from "../services/comment-repo";
import type { CommentMessage, CommentThread } from "../types";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Citizen",
  barangay_official: "Barangay Official",
  city_official: "City Official",
  admin: "Admin",
};

export function CommentThreadPanel({ threadId }: { threadId: string }) {
  const repo = React.useMemo(() => getCommentRepo(), []);
  const [thread, setThread] = React.useState<CommentThread | null>(null);
  const [messages, setMessages] = React.useState<CommentMessage[]>([]);
  const [reply, setReply] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [threadResult, messageResult] = await Promise.all([
          repo.getThread({ threadId }),
          repo.listMessages({ threadId }),
        ]);

        if (!active) return;
        setThread(threadResult);
        setMessages(messageResult);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load thread.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [repo, threadId]);

  async function handleReply() {
    const trimmed = reply.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const message = await repo.addReply({ threadId, text: trimmed });
      setMessages((prev) => [...prev, message]);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!threadId) return null;

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Comments</h3>
          {thread ? (
            <p className="text-xs text-slate-500">
              Thread ID: {thread.id}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-500">Loading thread…</div>
      ) : error ? (
        <div className="mt-4 text-sm text-rose-600">{error}</div>
      ) : !thread ? (
        <div className="mt-4 text-sm text-slate-500">
          Thread not found.
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-xl border border-slate-200 p-4",
                  message.authorRole === "citizen" ? "bg-slate-50" : "bg-white"
                )}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {ROLE_LABELS[message.authorRole] ?? message.authorRole}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <time dateTime={new Date(message.createdAt).toISOString()}>
                    {formatCommentDate(message.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-slate-700">{message.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <label className="text-xs font-semibold text-slate-600">
              Reply
            </label>
            <Textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write your response here..."
              className="min-h-[120px] border-slate-200 bg-white"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleReply}
                disabled={submitting || !reply.trim()}
                className="rounded-xl"
              >
                {submitting ? "Sending..." : "Send reply"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
