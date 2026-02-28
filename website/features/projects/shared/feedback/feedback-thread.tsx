"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  buildCitizenAuthHref,
  setReturnToInSessionStorage,
} from "@/features/citizen/auth/utils/auth-query";
import {
  createProjectFeedback,
  createProjectFeedbackReply,
  listProjectFeedback,
  ProjectFeedbackRequestError,
} from "./feedback.api";
import { FeedbackCard } from "./feedback-card";
import { FeedbackComposer } from "./feedback-composer";
import type {
  CitizenProjectFeedbackKind,
  ProjectFeedbackItem,
  ProjectFeedbackThread,
} from "./feedback.types";

type FeedbackThreadProps = {
  projectId: string;
};

type ReplyComposerState = {
  rootId: string;
  parentFeedbackId: string;
  replyToAuthor: string;
};

const EMPTY_STATE_TEXT =
  "No feedback yet. Be the first to share a commendation, suggestion, concern, or question.";

function sortByCreatedNewestFirst(items: ProjectFeedbackItem[]): ProjectFeedbackItem[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return rightTime - leftTime;
  });
}

function sortByCreatedOldestFirst(items: ProjectFeedbackItem[]): ProjectFeedbackItem[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return leftTime - rightTime;
  });
}

function groupFeedbackThreads(items: ProjectFeedbackItem[]): ProjectFeedbackThread[] {
  const roots = sortByCreatedNewestFirst(items.filter((item) => item.parentFeedbackId === null));
  const replies = items.filter((item) => item.parentFeedbackId !== null);

  const repliesByRootId = new Map<string, ProjectFeedbackItem[]>();
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

function normalizeApiError(error: unknown, fallback: string): string {
  if (error instanceof ProjectFeedbackRequestError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function FeedbackThread({ projectId }: FeedbackThreadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isProfileComplete, setIsProfileComplete] = React.useState(false);

  const [items, setItems] = React.useState<ProjectFeedbackItem[]>([]);
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

  const openAuthModal = React.useCallback(
    (input: { forceCompleteProfile?: boolean }) => {
      setReturnToInSessionStorage(currentDetailPath);
      const href = buildCitizenAuthHref({
        pathname,
        searchParams,
        mode: input.forceCompleteProfile ? null : "login",
        launchStep: "email",
        completeProfile: input.forceCompleteProfile === true,
        next: currentDetailPath,
      });
      router.replace(href, { scroll: false });
    },
    [currentDetailPath, pathname, router, searchParams]
  );

  const requireFeedbackAccess = React.useCallback((): boolean => {
    if (!isAuthenticated) {
      openAuthModal({ forceCompleteProfile: false });
      return false;
    }

    if (!isProfileComplete) {
      openAuthModal({ forceCompleteProfile: true });
      return false;
    }

    return true;
  }, [isAuthenticated, isProfileComplete, openAuthModal]);

  const loadProfileStatus = React.useCallback(async () => {
    const response = await fetch("/profile/status", {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; isComplete?: boolean }
      | null;

    if (!response.ok || !payload?.ok) {
      setIsProfileComplete(false);
      return;
    }

    setIsProfileComplete(payload.isComplete === true);
  }, []);

  const loadFeedback = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await listProjectFeedback(projectId);
      setItems(response.items);
    } catch (error) {
      setLoadError(normalizeApiError(error, "Failed to load project feedback."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
        setIsProfileComplete(false);
        setIsAuthLoading(false);
        return;
      }

      setIsAuthenticated(true);
      await loadProfileStatus();
      setIsAuthLoading(false);
    }

    resolveAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsAuthenticated(Boolean(session?.user?.id));
      if (session?.user?.id) {
        void loadProfileStatus();
      } else {
        setIsProfileComplete(false);
      }
      setIsAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfileStatus]);

  const threads = React.useMemo(() => groupFeedbackThreads(items), [items]);

  const handleReplyClick = React.useCallback(
    (item: ProjectFeedbackItem) => {
      if (!requireFeedbackAccess()) {
        return;
      }

      const rootId = item.parentFeedbackId ?? item.id;
      setReplyComposer({
        rootId,
        parentFeedbackId: item.id,
        replyToAuthor: item.author.fullName,
      });
    },
    [requireFeedbackAccess]
  );

  const handleCreateRootFeedback = React.useCallback(
    async (input: { kind: CitizenProjectFeedbackKind; body: string }) => {
      if (!requireFeedbackAccess()) {
        throw new Error("Complete sign in and profile setup to post feedback.");
      }

      setIsPostingRoot(true);
      const optimisticId = `temp_root_${Date.now()}`;
      const optimisticItem: ProjectFeedbackItem = {
        id: optimisticId,
        projectId,
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
        const response = await createProjectFeedback({
          projectId,
          kind: input.kind,
          body: input.body,
        });
        setItems((current) =>
          current.map((item) => (item.id === optimisticId ? response.item : item))
        );
      } catch (error) {
        setItems((current) => current.filter((item) => item.id !== optimisticId));
        if (error instanceof ProjectFeedbackRequestError) {
          if (error.status === 401) {
            openAuthModal({ forceCompleteProfile: false });
          } else if (error.status === 403 && error.message.toLowerCase().includes("complete")) {
            openAuthModal({ forceCompleteProfile: true });
          }
        }
        throw new Error(normalizeApiError(error, "Failed to post feedback."));
      } finally {
        setIsPostingRoot(false);
      }
    },
    [openAuthModal, projectId, requireFeedbackAccess]
  );

  const handleCreateReplyFeedback = React.useCallback(
    async (input: { kind: CitizenProjectFeedbackKind; body: string }) => {
      if (!replyComposer) {
        throw new Error("Reply target is missing.");
      }

      if (!requireFeedbackAccess()) {
        throw new Error("Complete sign in and profile setup to post a reply.");
      }

      setPostingReplyRootId(replyComposer.rootId);
      const optimisticId = `temp_reply_${Date.now()}`;
      const optimisticReply: ProjectFeedbackItem = {
        id: optimisticId,
        projectId,
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
        const response = await createProjectFeedbackReply({
          projectId,
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
        if (error instanceof ProjectFeedbackRequestError) {
          if (error.status === 401) {
            openAuthModal({ forceCompleteProfile: false });
          } else if (error.status === 403 && error.message.toLowerCase().includes("complete")) {
            openAuthModal({ forceCompleteProfile: true });
          }
        }
        throw new Error(normalizeApiError(error, "Failed to post reply."));
      } finally {
        setPostingReplyRootId(null);
      }
    },
    [openAuthModal, projectId, replyComposer, requireFeedbackAccess]
  );

  return (
    <section className="space-y-4" aria-label="Project feedback thread">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Feedback</h2>
            <p className="text-sm text-slate-500">
              Share a commendation, suggestion, concern, or question for this project.
            </p>
          </div>

          {!isAuthenticated || !isProfileComplete ? (
            <Button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal({ forceCompleteProfile: false });
                  return;
                }
                openAuthModal({ forceCompleteProfile: true });
              }}
              aria-label="Add project feedback"
              disabled={isAuthLoading}
            >
              Add feedback
            </Button>
          ) : null}
        </div>

        {isAuthenticated && isProfileComplete ? (
          <div className="mt-4">
            <FeedbackComposer
              submitLabel={isPostingRoot ? "Posting..." : "Post feedback"}
              disabled={isPostingRoot}
              placeholder="Share your feedback with the community and LGU."
              onSubmit={handleCreateRootFeedback}
            />
          </div>
        ) : null}
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading feedback...</p> : null}
      {!loading && loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}

      {!loading && !loadError && threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          {EMPTY_STATE_TEXT}
        </div>
      ) : null}

      {!loading && !loadError && threads.length > 0 ? (
        <div className="space-y-4">
          {threads.map((thread) => {
            const isPostingReply = postingReplyRootId === thread.root.id;
            const isReplyingHere = replyComposer?.rootId === thread.root.id;

            return (
              <div key={thread.root.id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <FeedbackCard
                  item={thread.root}
                  onReply={handleReplyClick}
                  replyDisabled={isPostingReply || isPostingRoot || isAuthLoading}
                />

                {thread.replies.length > 0 ? (
                  <div className="ml-4 space-y-3 border-l border-slate-200 pl-4">
                    {thread.replies.map((reply) => (
                      <FeedbackCard
                        key={reply.id}
                        item={reply}
                        onReply={handleReplyClick}
                        replyDisabled={isPostingReply || isPostingRoot || isAuthLoading}
                        isReply
                      />
                    ))}
                  </div>
                ) : null}

                {isReplyingHere ? (
                  <div className="ml-4 space-y-2 border-l border-slate-200 pl-4">
                    <p className="text-xs text-slate-500">
                      Replying to {replyComposer.replyToAuthor}
                    </p>
                    <FeedbackComposer
                      submitLabel={isPostingReply ? "Posting..." : "Post reply"}
                      disabled={isPostingReply}
                      placeholder="Write your reply..."
                      initialKind="question"
                      onSubmit={handleCreateReplyFeedback}
                      onCancel={() => setReplyComposer(null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
