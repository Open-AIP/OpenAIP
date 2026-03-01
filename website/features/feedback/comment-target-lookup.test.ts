import { describe, expect, it } from "vitest";
import { createCommentTargetLookupFromClient } from "@/lib/repos/feedback/repo.supabase.base";

describe("createCommentTargetLookupFromClient", () => {
  it("returns project UUID id instead of aip_ref_code", async () => {
    const fakeClient = {
      from(table: string) {
        if (table !== "projects") {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select() {
            return {
              limit() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({
                        data: {
                          id: "project-uuid-1",
                          aip_id: "aip-1",
                          aip_ref_code: "9000-01",
                          program_project_description: "Other project",
                          category: "other",
                          start_date: null,
                          completion_date: null,
                        },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
    };

    const lookup = createCommentTargetLookupFromClient(async () => fakeClient as any);
    const result = await lookup.getProject("9000-01");

    expect(result).toMatchObject({
      id: "project-uuid-1",
      aipId: "aip-1",
      kind: "other",
    });
  });
});
