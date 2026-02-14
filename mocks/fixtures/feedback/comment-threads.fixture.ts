import {
  AIP_IDS,
  AIP_ITEM_IDS,
  COMMENT_THREAD_IDS,
  PROJECT_IDS,
} from "@/mocks/fixtures/shared/id-contract.fixture";
import type { FeedbackKind } from "@/lib/contracts/databasev2";

type CommentTarget =
  | { targetKind: "project"; projectId: string }
  | { targetKind: "aip"; aipId: string }
  | { targetKind: "aip_item"; aipId: string; aipItemId: string };

type CommentThread = {
  id: string;
  createdAt: string;
  createdByUserId: string;
  target: CommentTarget;
  preview: {
    text: string;
    updatedAt: string;
    status: "no_response" | "responded";
    kind: FeedbackKind;
    authorName?: string;
    authorScopeLabel?: string | null;
  };
};

export const COMMENT_THREADS_FIXTURE: CommentThread[] = [
  {
    id: COMMENT_THREAD_IDS.thread_001,
    createdAt: "2026-01-18T02:05:00.000Z",
    createdByUserId: "citizen_rafael",
    target: {
      targetKind: "project",
      projectId: PROJECT_IDS.infra_road_rehab_2026_001,
    },
    preview: {
      text: "Please place warning signs near the school entrance.",
      updatedAt: "2026-01-18T02:05:00.000Z",
      status: "no_response",
      kind: "concern",
      authorName: "Rafael Santos",
      authorScopeLabel: "Brgy. San Isidro",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_002,
    createdAt: "2026-01-13T02:45:00.000Z",
    createdByUserId: "citizen_liza",
    target: {
      targetKind: "project",
      projectId: PROJECT_IDS.infra_drainage_2026_003,
    },
    preview: {
      text: "Please post the weekly progress schedule for transparency.",
      updatedAt: "2026-01-14T08:30:00.000Z",
      status: "responded",
      kind: "suggestion",
      authorName: "Liza Mercado",
      authorScopeLabel: "Brgy. San Isidro",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_003,
    createdAt: "2026-01-16T09:15:00.000Z",
    createdByUserId: "citizen_ana",
    target: {
      targetKind: "aip_item",
      aipId: AIP_IDS.barangay_mamadid_2026,
      aipItemId: AIP_ITEM_IDS.mamadid_2026_001,
    },
    preview: {
      text: "Can you share the material breakdown for this road project?",
      updatedAt: "2026-01-16T09:15:00.000Z",
      status: "no_response",
      kind: "question",
      authorName: "Ana Reyes",
      authorScopeLabel: "Brgy. Mamadid",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_004,
    createdAt: "2026-01-20T03:00:00.000Z",
    createdByUserId: "citizen_joanna",
    target: {
      targetKind: "aip_item",
      aipId: AIP_IDS.barangay_sanisidro_2026,
      aipItemId: AIP_ITEM_IDS.sanisidro_2026_063,
    },
    preview: {
      text: "Will the procurement include training for staff on new equipment?",
      updatedAt: "2026-01-21T04:10:00.000Z",
      status: "responded",
      kind: "commend",
      authorName: "Joanna Lim",
      authorScopeLabel: "Brgy. San Isidro",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_005,
    createdAt: "2026-01-22T01:40:00.000Z",
    createdByUserId: "citizen_marco",
    target: {
      targetKind: "project",
      projectId: PROJECT_IDS.infra_public_market_2026_007,
    },
    preview: {
      text: "Will the market include a covered loading bay for vendors?",
      updatedAt: "2026-01-22T01:40:00.000Z",
      status: "no_response",
      kind: "concern",
      authorName: "Marco Dizon",
      authorScopeLabel: "Brgy. Poblacion",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_006,
    createdAt: "2026-01-23T06:25:00.000Z",
    createdByUserId: "citizen_lina",
    target: {
      targetKind: "project",
      projectId: PROJECT_IDS.health_mental_2026_005,
    },
    preview: {
      text: "Can we have monthly counseling sessions for seniors?",
      updatedAt: "2026-01-24T02:10:00.000Z",
      status: "responded",
      kind: "suggestion",
      authorName: "Lina Bautista",
      authorScopeLabel: "Brgy. Santa Rita",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_007,
    createdAt: "2026-01-25T08:15:00.000Z",
    createdByUserId: "citizen_anton",
    target: {
      targetKind: "aip_item",
      aipId: AIP_IDS.barangay_poblacion_2026,
      aipItemId: AIP_ITEM_IDS.poblacion_2026_013,
    },
    preview: {
      text: "Is there a separate budget for senior citizen facilities?",
      updatedAt: "2026-01-25T08:15:00.000Z",
      status: "no_response",
      kind: "question",
      authorName: "Anton Reyes",
      authorScopeLabel: "Brgy. Poblacion",
    },
  },
  {
    id: COMMENT_THREAD_IDS.thread_008,
    createdAt: "2026-01-26T05:55:00.000Z",
    createdByUserId: "citizen_janelle",
    target: {
      targetKind: "aip_item",
      aipId: AIP_IDS.city_2026,
      aipItemId: AIP_ITEM_IDS.city_2026_031,
    },
    preview: {
      text: "Please confirm if stall upgrades include improved drainage.",
      updatedAt: "2026-01-27T03:00:00.000Z",
      status: "responded",
      kind: "commend",
      authorName: "Janelle Cruz",
      authorScopeLabel: "City District 2",
    },
  },
];
