import { createFeedbackRepoFromClient } from "@/lib/repos/feedback/repo.supabase.base";
import type { RoleType } from "@/lib/contracts/databasev2";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

type RpcCall = {
  fn: string;
  args: Record<string, unknown>;
};

type FeedbackRepoClient = Awaited<ReturnType<Parameters<typeof createFeedbackRepoFromClient>[0]>>;

function createFakeClient(input: {
  profileRole: RoleType;
  rpcCalls: RpcCall[];
}) {
  let feedbackSelectCall = 0;
  const parentRow = {
    id: "thread-root",
    target_type: "aip" as const,
    aip_id: "aip-001",
    project_id: null,
    parent_feedback_id: null,
    source: "human" as const,
    kind: "question" as const,
    body: "Original thread",
    author_id: "citizen-1",
    is_public: true,
    created_at: "2026-02-27T09:00:00.000Z",
    updated_at: "2026-02-27T09:00:00.000Z",
  };

  return {
    from(table: string) {
      if (table === "activity_log") {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      limit() {
                        return {
                          maybeSingle: async () => ({ data: null, error: null }),
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "feedback") {
        return {
          select() {
            feedbackSelectCall += 1;

            if (feedbackSelectCall === 1) {
              return {
                eq(column: string, value: unknown) {
                  assert(column === "id", "Expected parent lookup to filter by id");
                  assert(value === "thread-root", "Expected reply parent id lookup");
                  return {
                    maybeSingle: async () => ({ data: parentRow, error: null }),
                  };
                },
              };
            }

            if (feedbackSelectCall === 2) {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        gte: async () => ({ data: [], error: null }),
                      };
                    },
                  };
                },
              };
            }

            throw new Error(`Unexpected feedback select call #${feedbackSelectCall}`);
          },

          insert(payload: Record<string, unknown>) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      id: "reply-001",
                      target_type: payload.target_type,
                      aip_id: payload.aip_id,
                      project_id: payload.project_id,
                      parent_feedback_id: payload.parent_feedback_id,
                      source: "human",
                      kind: payload.kind,
                      body: payload.body,
                      author_id: payload.author_id,
                      is_public: payload.is_public,
                      created_at: "2026-02-27T09:05:00.000Z",
                      updated_at: "2026-02-27T09:05:00.000Z",
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "profiles") {
        return {
          select() {
            return {
              in: async () => ({
                data: [
                  {
                    id: "official-1",
                    role: input.profileRole,
                    full_name: "Official One",
                    barangay_id: "brgy_mamadid",
                    city_id: null,
                    municipality_id: null,
                  },
                ],
                error: null,
              }),
            };
          },
        };
      }

      throw new Error(`Unexpected table in fake feedback client: ${table}`);
    },

    rpc: async (fn: string, args: Record<string, unknown>) => {
      input.rpcCalls.push({ fn, args });
      return { data: "log-1", error: null };
    },
  };
}

export async function runFeedbackCommentReplyAuditLogTests() {
  const barangayRpcCalls: RpcCall[] = [];
  const barangayClient = createFakeClient({
    profileRole: "barangay_official",
    rpcCalls: barangayRpcCalls,
  });

  const barangayRepo = createFeedbackRepoFromClient(
    async () => barangayClient as FeedbackRepoClient
  );

  await barangayRepo.reply("thread-root", {
    kind: "lgu_note",
    body: "Thank you for your feedback.",
    authorId: "official-1",
    isPublic: true,
  });

  assert(barangayRpcCalls.length === 1, "Expected barangay reply to emit one audit RPC call");
  const logged = barangayRpcCalls[0];
  assert(logged.fn === "log_activity", "Expected audit logger to use log_activity RPC");
  assert(logged.args.p_action === "comment_replied", "Expected comment_replied audit action");
  assert(
    (logged.args.p_metadata as Record<string, unknown>).source === "workflow",
    "Expected reply audit metadata to mark workflow source"
  );
  assert(
    (logged.args.p_metadata as Record<string, unknown>).hide_crud_action === "feedback_created",
    "Expected reply audit metadata to include hide_crud_action for dedupe"
  );

  const cityRpcCalls: RpcCall[] = [];
  const cityClient = createFakeClient({
    profileRole: "city_official",
    rpcCalls: cityRpcCalls,
  });
  const cityRepo = createFeedbackRepoFromClient(
    async () => cityClient as FeedbackRepoClient
  );

  await cityRepo.reply("thread-root", {
    kind: "lgu_note",
    body: "City-level reply",
    authorId: "official-1",
    isPublic: true,
  });

  assert(
    cityRpcCalls.length === 0,
    "Expected non-barangay roles to skip comment_replied workflow logging"
  );
}
