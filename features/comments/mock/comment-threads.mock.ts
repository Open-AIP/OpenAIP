import type { CommentThread } from "../types";

export const COMMENT_THREADS_MOCK: CommentThread[] = [
  {
    id: "thread_001",
    createdAt: "2026-01-18T02:05:00.000Z",
    createdByUserId: "citizen_rafael",
    target: {
      targetKind: "project",
      projectId: "PROJ-I-2026-001",
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
    id: "thread_002",
    createdAt: "2026-01-13T02:45:00.000Z",
    createdByUserId: "citizen_liza",
    target: {
      targetKind: "project",
      projectId: "PROJ-I-2026-003",
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
    id: "thread_003",
    createdAt: "2026-01-16T09:15:00.000Z",
    createdByUserId: "citizen_ana",
    target: {
      targetKind: "aip_item",
      aipId: "aip-2026-mamadid",
      aipItemId: "aiprow-001",
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
    id: "thread_004",
    createdAt: "2026-01-20T03:00:00.000Z",
    createdByUserId: "citizen_joanna",
    target: {
      targetKind: "aip_item",
      aipId: "aip-2026-sanisidro",
      aipItemId: "aiprow-063",
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
