import type { ActorContext } from "@/lib/domain/actor-context";
import { getAuditFeedForActor } from "@/lib/repos/audit/queries";
import { ACTIVITY_LOG_FIXTURE } from "@/mocks/fixtures/audit/activity-log.fixture";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function removeFixtureRows(ids: string[]) {
  for (let index = ACTIVITY_LOG_FIXTURE.length - 1; index >= 0; index -= 1) {
    if (ids.includes(ACTIVITY_LOG_FIXTURE[index].id)) {
      ACTIVITY_LOG_FIXTURE.splice(index, 1);
    }
  }
}

export async function runAuditCrudDedupeTests() {
  const actor: ActorContext = {
    userId: "user_001",
    role: "barangay_official",
    scope: { kind: "barangay", id: "brgy_mamadid" },
  };

  type ActivityFixtureRow = (typeof ACTIVITY_LOG_FIXTURE)[number];

  const injectedRows: ActivityFixtureRow[] = [
    {
      id: "dedupe_crud_match",
      actorId: "user_001",
      actorRole: "barangay_official",
      action: "aip_updated",
      entityType: "aips",
      entityId: "aip-dedupe-1",
      scope: {
        scope_type: "barangay" as const,
        barangay_id: "brgy_mamadid",
        city_id: null,
        municipality_id: null,
      },
      metadata: {
        source: "crud",
      },
      createdAt: "2026-02-27T10:00:03.000Z",
    },
    {
      id: "dedupe_workflow_match",
      actorId: "user_001",
      actorRole: "barangay_official",
      action: "submission_created",
      entityType: "aips",
      entityId: "aip-dedupe-1",
      scope: {
        scope_type: "barangay" as const,
        barangay_id: "brgy_mamadid",
        city_id: null,
        municipality_id: null,
      },
      metadata: {
        source: "workflow",
        hide_crud_action: "aip_updated",
      },
      createdAt: "2026-02-27T10:00:10.000Z",
    },
    {
      id: "dedupe_crud_outside_window",
      actorId: "user_001",
      actorRole: "barangay_official",
      action: "aip_updated",
      entityType: "aips",
      entityId: "aip-dedupe-2",
      scope: {
        scope_type: "barangay" as const,
        barangay_id: "brgy_mamadid",
        city_id: null,
        municipality_id: null,
      },
      metadata: {
        source: "crud",
      },
      createdAt: "2026-02-27T11:00:00.000Z",
    },
    {
      id: "dedupe_workflow_outside_window",
      actorId: "user_001",
      actorRole: "barangay_official",
      action: "submission_created",
      entityType: "aips",
      entityId: "aip-dedupe-2",
      scope: {
        scope_type: "barangay" as const,
        barangay_id: "brgy_mamadid",
        city_id: null,
        municipality_id: null,
      },
      metadata: {
        source: "workflow",
        hide_crud_action: "aip_updated",
      },
      createdAt: "2026-02-27T11:00:30.000Z",
    },
  ];

  ACTIVITY_LOG_FIXTURE.push(...injectedRows);

  try {
    const feed = await getAuditFeedForActor(actor);
    const ids = new Set(feed.map((row) => row.id));

    assert(
      !ids.has("dedupe_crud_match"),
      "Expected matching CRUD row to be suppressed from barangay audit feed"
    );
    assert(
      ids.has("dedupe_workflow_match"),
      "Expected workflow row to remain visible in barangay audit feed"
    );

    assert(
      ids.has("dedupe_crud_outside_window"),
      "Expected CRUD row outside dedupe window to remain visible"
    );
    assert(
      ids.has("dedupe_workflow_outside_window"),
      "Expected outside-window workflow row to remain visible"
    );
  } finally {
    removeFixtureRows(injectedRows.map((row) => row.id));
  }
}
