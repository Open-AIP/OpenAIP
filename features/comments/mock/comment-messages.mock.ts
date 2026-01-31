import type { CommentMessage } from "../types";

export const COMMENT_MESSAGES_MOCK: CommentMessage[] = [
  {
    id: "cmsg_001",
    threadId: "thread_001",
    authorRole: "citizen",
    authorId: "citizen_rafael",
    text: "Please place warning signs near the school entrance.",
    createdAt: "2026-01-18T02:05:00.000Z",
  },
  {
    id: "cmsg_002",
    threadId: "thread_002",
    authorRole: "citizen",
    authorId: "citizen_liza",
    text: "Please post the weekly progress schedule for transparency.",
    createdAt: "2026-01-13T02:45:00.000Z",
  },
  {
    id: "cmsg_003",
    threadId: "thread_002",
    authorRole: "barangay_official",
    authorId: "official_001",
    text: "We will publish a weekly update every Friday on the barangay page.",
    createdAt: "2026-01-14T08:30:00.000Z",
  },
  {
    id: "cmsg_004",
    threadId: "thread_003",
    authorRole: "citizen",
    authorId: "citizen_ana",
    text: "Can you share the material breakdown for this road project?",
    createdAt: "2026-01-16T09:15:00.000Z",
  },
  {
    id: "cmsg_005",
    threadId: "thread_004",
    authorRole: "citizen",
    authorId: "citizen_joanna",
    text: "Will the procurement include training for staff on new equipment?",
    createdAt: "2026-01-20T03:00:00.000Z",
  },
  {
    id: "cmsg_006",
    threadId: "thread_004",
    authorRole: "city_official",
    authorId: "official_002",
    text: "Yes, the procurement package includes training and onboarding sessions.",
    createdAt: "2026-01-21T04:10:00.000Z",
  },
];
