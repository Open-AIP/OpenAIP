import { COMMENT_THREAD_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";
import type { FeedbackKind } from "@/lib/contracts/databasev2";

type CommentMessage = {
  id: string;
  threadId: string;
  authorRole: "citizen" | "barangay_official" | "city_official" | "admin";
  authorId: string;
  kind: FeedbackKind;
  text: string;
  createdAt: string;
};

export const COMMENT_MESSAGES_FIXTURE: CommentMessage[] = [
  {
    id: "cmsg_001",
    threadId: COMMENT_THREAD_IDS.thread_001,
    authorRole: "citizen",
    authorId: "citizen_rafael",
    kind: "concern",
    text: "Please place warning signs near the school entrance.",
    createdAt: "2026-01-18T02:05:00.000Z",
  },
  {
    id: "cmsg_002",
    threadId: COMMENT_THREAD_IDS.thread_002,
    authorRole: "citizen",
    authorId: "citizen_liza",
    kind: "suggestion",
    text: "Please post the weekly progress schedule for transparency.",
    createdAt: "2026-01-13T02:45:00.000Z",
  },
  {
    id: "cmsg_003",
    threadId: COMMENT_THREAD_IDS.thread_002,
    authorRole: "barangay_official",
    authorId: "official_001",
    kind: "lgu_note",
    text: "We will publish a weekly update every Friday on the barangay page.",
    createdAt: "2026-01-14T08:30:00.000Z",
  },
  {
    id: "cmsg_004",
    threadId: COMMENT_THREAD_IDS.thread_003,
    authorRole: "citizen",
    authorId: "citizen_ana",
    kind: "question",
    text: "Can you share the material breakdown for this road project?",
    createdAt: "2026-01-16T09:15:00.000Z",
  },
  {
    id: "cmsg_005",
    threadId: COMMENT_THREAD_IDS.thread_004,
    authorRole: "citizen",
    authorId: "citizen_joanna",
    kind: "commend",
    text: "Will the procurement include training for staff on new equipment?",
    createdAt: "2026-01-20T03:00:00.000Z",
  },
  {
    id: "cmsg_006",
    threadId: COMMENT_THREAD_IDS.thread_004,
    authorRole: "city_official",
    authorId: "official_002",
    kind: "lgu_note",
    text: "Yes, the procurement package includes training and onboarding sessions.",
    createdAt: "2026-01-21T04:10:00.000Z",
  },
  {
    id: "cmsg_007",
    threadId: COMMENT_THREAD_IDS.thread_005,
    authorRole: "citizen",
    authorId: "citizen_marco",
    kind: "concern",
    text: "Will the market include a covered loading bay for vendors?",
    createdAt: "2026-01-22T01:40:00.000Z",
  },
  {
    id: "cmsg_008",
    threadId: COMMENT_THREAD_IDS.thread_006,
    authorRole: "citizen",
    authorId: "citizen_lina",
    kind: "suggestion",
    text: "Can we have monthly counseling sessions for seniors?",
    createdAt: "2026-01-23T06:25:00.000Z",
  },
  {
    id: "cmsg_009",
    threadId: COMMENT_THREAD_IDS.thread_006,
    authorRole: "barangay_official",
    authorId: "official_003",
    kind: "lgu_note",
    text: "We are coordinating with the health office to schedule monthly sessions.",
    createdAt: "2026-01-24T02:10:00.000Z",
  },
  {
    id: "cmsg_010",
    threadId: COMMENT_THREAD_IDS.thread_007,
    authorRole: "citizen",
    authorId: "citizen_anton",
    kind: "question",
    text: "Is there a separate budget for senior citizen facilities?",
    createdAt: "2026-01-25T08:15:00.000Z",
  },
  {
    id: "cmsg_011",
    threadId: COMMENT_THREAD_IDS.thread_008,
    authorRole: "citizen",
    authorId: "citizen_janelle",
    kind: "commend",
    text: "Please confirm if stall upgrades include improved drainage.",
    createdAt: "2026-01-26T05:55:00.000Z",
  },
  {
    id: "cmsg_012",
    threadId: COMMENT_THREAD_IDS.thread_008,
    authorRole: "city_official",
    authorId: "official_004",
    kind: "lgu_note",
    text: "Yes, drainage upgrades are included in the modernization scope.",
    createdAt: "2026-01-27T03:00:00.000Z",
  },
];
