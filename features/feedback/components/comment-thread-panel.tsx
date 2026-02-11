"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/ui/utils";

import { formatCommentDate } from "../lib/format";
import { getCommentRepo } from "@/lib/repos/feedback/selector";
import type { CommentMessage, CommentThread } from "../types";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Citizen",
  barangay_official: "Barangay Official",
  city_official: "City Official",
  admin: "Admin",
};

export function CommentThreadPanel({
  threadId,
  variant = "card",
}: {
  threadId: string;
  variant?: "card" | "embedded";
}) {
  const repo = React.useMemo(() => getCommentRepo(), []);
  const [thread, setThread] = React.useState<CommentThread | null>(null);
  const [messages, setMessages] = React.useState<CommentMessage[]>([]);
  const [reply, setReply] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [showReply, setShowReply] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isEmbedded = variant === "embedded";
  const messagesToRender = isEmbedded ? messages.slice(1) : messages;

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

  const content = loading ? (
    <div className={cn(isEmbedded ? "text-sm" : "mt-4 text-sm", "text-slate-500")}>
      Loading thread...
    </div>
  ) : error ? (
    <div className={cn(isEmbedded ? "text-sm" : "mt-4 text-sm", "text-rose-600")}>
      {error}
    </div>
  ) : !thread ? (
    <div className={cn(isEmbedded ? "text-sm" : "mt-4 text-sm", "text-slate-500")}>
      Thread not found.
    </div>
  ) : (
    <>
      <div
        className={cn(
          isEmbedded ? "space-y-4 pl-14" : "mt-4 space-y-4"
        )}
      >
        {messagesToRender.map((message) => {
          const isCitizen = message.authorRole === "citizen";
          const roleLabel = ROLE_LABELS[message.authorRole] ?? message.authorRole;
          const displayName = isCitizen ? "Citizen" : "Official";

          return (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl border border-slate-200 p-4 shadow-sm",
                isCitizen ? "bg-white" : "bg-slate-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-full bg-teal-800 text-white">
                  <span className="text-sm font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>
                    {!isCitizen ? (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{roleLabel}</span>
                      </>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {message.text}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <time dateTime={new Date(message.createdAt).toISOString()}>
                      {formatCommentDate(message.createdAt)}
                    </time>
                    <button
                      type="button"
                      className="font-semibold text-slate-700"
                      onClick={() => setShowReply(true)}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn(isEmbedded ? "mt-4 space-y-3" : "mt-6 space-y-3")}>
        {isEmbedded && !showReply ? (
          <button
            type="button"
            className="text-xs font-semibold text-slate-700"
            onClick={() => setShowReply(true)}
          >
            Reply
          </button>
        ) : null}

        {showReply ? (
          <>
            <label className="text-xs font-semibold text-slate-600">Reply</label>
            <Textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write your response here..."
              className="min-h-[120px] border-slate-200 bg-white"
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowReply(false);
                  setReply("");
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReply}
                disabled={submitting || !reply.trim()}
                className="rounded-xl"
              >
                {submitting ? "Sending..." : "Send reply"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );

  if (isEmbedded) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {content}
    </div>
  );
}
