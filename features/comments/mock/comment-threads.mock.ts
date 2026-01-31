import type { CommentThread } from "../types";
import {
  AIP_IDS,
  AIP_ITEM_IDS,
  COMMENT_THREAD_IDS,
  PROJECT_IDS,
} from "@/features/shared/mock/id-contract";

export const COMMENT_THREADS_MOCK: CommentThread[] = [
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
      authorName: "Joanna Lim",
      authorScopeLabel: "Brgy. San Isidro",
    },
  },
];
