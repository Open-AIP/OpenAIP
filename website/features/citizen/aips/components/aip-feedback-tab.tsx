"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FeedbackComposer } from "@/features/projects/shared/feedback";
import type { CitizenProjectFeedbackKind } from "@/features/projects/shared/feedback";
import {
  type AipFeedbackDisplayKind,
  type AipFeedbackItem,
  AipFeedbackRequestError,
  createCitizenAipFeedback,
  createCitizenAipFeedbackReply,
  listAipFeedback,
  normalizeAipFeedbackApiError,
} from "./aip-feedback.api";

type AipFeedbackThread = {
  root: AipFeedbackItem;
  replies: AipFeedbackItem[];
};

type ReplyComposerState = {
  rootId: string;
  parentFeedbackId: string;
  replyToAuthor: string;
};

type Props = {
  aipId: string;
  feedbackCount: number;
};

function sortByCreatedNewestFirst(items: AipFeedbackItem[]): AipFeedbackItem[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return rightTime - leftTime;
  });
}

function sortByCreatedOldestFirst(items: AipFeedbackItem[]): AipFeedbackItem[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return leftTime - rightTime;
  });
}

function groupFeedbackThreads(items: AipFeedbackItem[]): AipFeedbackThread[] {
  const roots = sortByCreatedNewestFirst(items.filter((item) => item.parentFeedbackId === null));
  const replies = items.filter((item) => item.parentFeedbackId !== null);
  const repliesByRootId = new Map<string, AipFeedbackItem[]>();

  for (const reply of replies) {
    const rootId = reply.parentFeedbackId;
    if (!rootId) continue;
    const list = repliesByRootId.get(rootId) ?? [];
    list.push(reply);
    repliesByRootId.set(rootId, list);
  }

  return roots.map((root) => ({
    root,
    replies: sortByCreatedOldestFirst(repliesByRootId.get(root.id) ?? []),
  }));
}

function buildFeedbackSignInHref(currentPath: string): string {
  const params = new URLSearchParams();
  params.set("next", currentPath);
  params.set("returnTo", currentPath);
  return `/sign-in?${params.toString()}`;
}

function formatFeedbackTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown time";
  const dateLabel = parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  const timeLabel = parsed.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
  return `${dateLabel} | ${timeLabel}`;
}

const KIND_LABELS: Record<AipFeedbackDisplayKind, string> = {
  commend: "Commend",
  suggestion: "Suggestion",
  concern: "Concern",
  question: "Question",
  lgu_note: "LGU Note",
};

const KIND_BADGE_CLASSES: Record<AipFeedbackDisplayKind, string> = {
  commend: "border-emerald-200 text-emerald-700",
  suggestion: "border-amber-200 text-amber-700",
  concern: "border-rose-200 text-rose-700",
  question: "border-slate-200 text-slate-700",
  lgu_note: "border-sky-200 text-sky-700",
};

function FeedbackCard({
  item,
  onReply,
  replyDisabled,
  showReplyButton,
}: {
  item: AipFeedbackItem;
  onReply: (item: AipFeedbackItem) => void;
  replyDisabled: boolean;
  showReplyButton?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.author.fullName}</p>
          <p className="text-xs text-slate-500">
            {item.author.roleLabel} | {item.author.lguLabel}
          </p>
        </div>
        <p className="text-xs text-slate-500">{formatFeedbackTimestamp(item.createdAt)}</p>
      </div>

      <div className="mt-3">
        <Badge variant="outline" className={`rounded-full ${KIND_BADGE_CLASSES[item.kind]}`}>
          {KIND_LABELS[item.kind]}
        </Badge>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p>

      {showReplyButton === false ? null : (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
            aria-label={`Reply to feedback from ${item.author.fullName}`}
            onClick={() => onReply(item)}
            disabled={replyDisabled}
          >
            Reply
          </Button>
        </div>
      )}
    </article>
  );
}

function ThreadList({
  threads,
  postingReplyRootId,
  isPostingRoot,
  isAuthLoading,
  replyComposer,
  onReply,
  onCancelReply,
  onSubmitReply,
  readOnly,
}: {
  threads: AipFeedbackThread[];
  postingReplyRootId: string | null;
  isPostingRoot: boolean;
  isAuthLoading: boolean;
  replyComposer: ReplyComposerState | null;
  onReply: (item: AipFeedbackItem) => void;
  onCancelReply: () => void;
  onSubmitReply: (input: { kind: CitizenProjectFeedbackKind; body: string }) => Promise<void>;
  readOnly?: boolean;
}) {
  if (threads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => {
        const isPostingReply = postingReplyRootId === thread.root.id;
        const isReplyingHere = replyComposer?.rootId === thread.root.id;

        return (
          <div key={thread.root.id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <FeedbackCard
              item={thread.root}
              onReply={onReply}
              replyDisabled={readOnly || isPostingReply || isPostingRoot || isAuthLoading}
              showReplyButton={!readOnly}
            />

            {thread.replies.length > 0 ? (
              <div className="ml-4 space-y-3 border-l border-slate-200 pl-4">
                {thread.replies.map((reply) => (
                  <FeedbackCard
                    key={reply.id}
                    item={reply}
                    onReply={onReply}
                    replyDisabled={readOnly || isPostingReply || isPostingRoot || isAuthLoading}
                    showReplyButton={!readOnly}
                  />
                ))}
              </div>
            ) : null}

            {isReplyingHere && !readOnly ? (
              <div className="ml-4 space-y-2 border-l border-slate-200 pl-4">
                <p className="text-xs text-slate-500">
                  Replying to {replyComposer?.replyToAuthor}
                </p>
                <FeedbackComposer
                  submitLabel={isPostingReply ? "Posting..." : "Post reply"}
                  disabled={isPostingReply}
                  placeholder="Write your reply..."
                  initialKind="question"
                  onSubmit={onSubmitReply}
                  onCancel={onCancelReply}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function AipFeedbackTab({ aipId, feedbackCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [items, setItems] = React.useState<AipFeedbackItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isPostingRoot, setIsPostingRoot] = React.useState(false);
  const [postingReplyRootId, setPostingReplyRootId] = React.useState<string | null>(null);
  const [replyComposer, setReplyComposer] = React.useState<ReplyComposerState | null>(null);

  const currentDetailPath = React.useMemo(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    return `${path}#feedback`;
  }, [pathname, searchParams]);

  const redirectToCitizenSignIn = React.useCallback(() => {
    router.push(buildFeedbackSignInHref(currentDetailPath));
  }, [currentDetailPath, router]);

  const loadFeedback = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await listAipFeedback(aipId);
      setItems(response.items);
    } catch (error) {
      setLoadError(normalizeAipFeedbackApiError(error, "Failed to load AIP feedback."));
    } finally {
      setLoading(false);
    }
  }, [aipId]);

  React.useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  React.useEffect(() => {
    let active = true;
    const supabase = supabaseBrowser();

    async function resolveAuthState() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user?.id) {
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        return;
      }
      setIsAuthenticated(true);
      setIsAuthLoading(false);
    }

    void resolveAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsAuthenticated(Boolean(session?.user?.id));
      setIsAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const threads = React.useMemo(() => groupFeedbackThreads(items), [items]);
  const citizenThreads = React.useMemo(
    () => threads.filter((thread) => thread.root.author.role === "citizen"),
    [threads]
  );
  const workflowThreads = React.useMemo(
    () => threads.filter((thread) => thread.root.author.role !== "citizen"),
    [threads]
  );

  const handleReplyClick = React.useCallback(
    (item: AipFeedbackItem) => {
      if (!isAuthenticated) {
        redirectToCitizenSignIn();
        return;
      }

      const rootId = item.parentFeedbackId ?? item.id;
      setReplyComposer({
        rootId,
        parentFeedbackId: item.id,
        replyToAuthor: item.author.fullName,
      });
    },
    [isAuthenticated, redirectToCitizenSignIn]
  );

  const handleCreateRootFeedback = React.useCallback(
    async (input: { kind: CitizenProjectFeedbackKind; body: string }) => {
      if (!isAuthenticated) {
        redirectToCitizenSignIn();
        throw new Error("Please sign in to post feedback.");
      }

      setIsPostingRoot(true);
      const optimisticId = `temp_root_${Date.now()}`;
      const optimisticItem: AipFeedbackItem = {
        id: optimisticId,
        aipId,
        parentFeedbackId: null,
        kind: input.kind,
        body: input.body,
        createdAt: new Date().toISOString(),
        author: {
          id: null,
          fullName: "You",
          role: "citizen",
          roleLabel: "Citizen",
          lguLabel: "Brgy. Unknown",
        },
      };

      setItems((current) => [optimisticItem, ...current]);
      try {
        const response = await createCitizenAipFeedback(aipId, input);
        setItems((current) =>
          current.map((item) => (item.id === optimisticId ? response.item : item))
        );
      } catch (error) {
        setItems((current) => current.filter((item) => item.id !== optimisticId));
        if (error instanceof AipFeedbackRequestError && error.status === 401) {
          redirectToCitizenSignIn();
        }
        throw new Error(normalizeAipFeedbackApiError(error, "Failed to post feedback."));
      } finally {
        setIsPostingRoot(false);
      }
    },
    [aipId, isAuthenticated, redirectToCitizenSignIn]
  );

  const handleCreateReplyFeedback = React.useCallback(
    async (input: { kind: CitizenProjectFeedbackKind; body: string }) => {
      if (!replyComposer) {
        throw new Error("Reply target is missing.");
      }
      if (!isAuthenticated) {
        redirectToCitizenSignIn();
        throw new Error("Please sign in to post a reply.");
      }

      setPostingReplyRootId(replyComposer.rootId);
      const optimisticId = `temp_reply_${Date.now()}`;
      const optimisticReply: AipFeedbackItem = {
        id: optimisticId,
        aipId,
        parentFeedbackId: replyComposer.rootId,
        kind: input.kind,
        body: input.body,
        createdAt: new Date().toISOString(),
        author: {
          id: null,
          fullName: "You",
          role: "citizen",
          roleLabel: "Citizen",
          lguLabel: "Brgy. Unknown",
        },
      };

      setItems((current) => [...current, optimisticReply]);
      try {
        const response = await createCitizenAipFeedbackReply(aipId, {
          parentFeedbackId: replyComposer.parentFeedbackId,
          kind: input.kind,
          body: input.body,
        });
        setItems((current) =>
          current.map((item) => (item.id === optimisticId ? response.item : item))
        );
        setReplyComposer(null);
      } catch (error) {
        setItems((current) => current.filter((item) => item.id !== optimisticId));
        if (error instanceof AipFeedbackRequestError && error.status === 401) {
          redirectToCitizenSignIn();
        }
        throw new Error(normalizeAipFeedbackApiError(error, "Failed to post reply."));
      } finally {
        setPostingReplyRootId(null);
      }
    },
    [aipId, isAuthenticated, redirectToCitizenSignIn, replyComposer]
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-3xl text-slate-900">Citizen Feedback</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-lg text-slate-600">Public citizen feedback for this AIP.</p>
          <p className="text-xs text-slate-500">Published threads: {feedbackCount}</p>

          {!isAuthenticated ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={redirectToCitizenSignIn}
                  disabled={isAuthLoading}
                >
                  Sign in to share feedback
                </Button>
              </div>
            </div>
          ) : (
            <FeedbackComposer
              submitLabel={isPostingRoot ? "Posting..." : "Post feedback"}
              disabled={isPostingRoot}
              placeholder="Share your thoughts about this AIP."
              onSubmit={handleCreateRootFeedback}
            />
          )}

          {loading ? <p className="text-sm text-slate-500">Loading feedback...</p> : null}
          {!loading && loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}

          {!loading && !loadError && citizenThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No citizen feedback yet. Be the first to share a commendation, suggestion, concern, or question.
            </div>
          ) : null}

          {!loading && !loadError ? (
            <ThreadList
              threads={citizenThreads}
              postingReplyRootId={postingReplyRootId}
              isPostingRoot={isPostingRoot}
              isAuthLoading={isAuthLoading}
              replyComposer={replyComposer}
              onReply={handleReplyClick}
              onCancelReply={() => setReplyComposer(null)}
              onSubmitReply={handleCreateReplyFeedback}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-3xl text-slate-900">LGU Workflow Feedback</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-lg text-slate-600">
            Official workflow feedback from the AIP submission and review process.
          </p>

          {loading ? <p className="text-sm text-slate-500">Loading feedback...</p> : null}
          {!loading && loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}

          {!loading && !loadError && workflowThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No workflow feedback available for this AIP yet.
            </div>
          ) : null}

          {!loading && !loadError ? (
            <ThreadList
              threads={workflowThreads}
              postingReplyRootId={null}
              isPostingRoot={false}
              isAuthLoading={isAuthLoading}
              replyComposer={null}
              onReply={() => {
                // Read-only workflow container
              }}
              onCancelReply={() => {
                // Read-only workflow container
              }}
              onSubmitReply={async () => {
                // Read-only workflow container
              }}
              readOnly
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
