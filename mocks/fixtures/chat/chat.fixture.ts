import type { ChatMessageRow, ChatSessionRow } from "@/lib/contracts/databasev2";

export const CHAT_DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000101";

export const CHAT_SESSION_IDS = {
  budget: "00000000-0000-0000-0000-000000000201",
  status: "00000000-0000-0000-0000-000000000202",
  compliance: "00000000-0000-0000-0000-000000000203",
} as const;

export const CHAT_SESSIONS_FIXTURE: ChatSessionRow[] = [
  {
    id: CHAT_SESSION_IDS.budget,
    user_id: CHAT_DEFAULT_USER_ID,
    title: "AIP Budget Allocation",
    context: {},
    last_message_at: "2026-02-10T14:31:00.000Z",
    created_at: "2026-02-10T14:25:00.000Z",
    updated_at: "2026-02-10T14:31:00.000Z",
  },
  {
    id: CHAT_SESSION_IDS.status,
    user_id: CHAT_DEFAULT_USER_ID,
    title: "Project Status Update",
    context: {},
    last_message_at: "2026-02-09T16:42:00.000Z",
    created_at: "2026-02-09T16:35:00.000Z",
    updated_at: "2026-02-09T16:42:00.000Z",
  },
  {
    id: CHAT_SESSION_IDS.compliance,
    user_id: CHAT_DEFAULT_USER_ID,
    title: "Compliance Requirements",
    context: {},
    last_message_at: "2026-01-18T10:05:00.000Z",
    created_at: "2026-01-18T09:55:00.000Z",
    updated_at: "2026-01-18T10:05:00.000Z",
  },
];

export const CHAT_MESSAGES_FIXTURE: ChatMessageRow[] = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    session_id: CHAT_SESSION_IDS.budget,
    role: "user",
    content: "How should I allocate the budget for health programs?",
    citations: null,
    retrieval_meta: { is_error: true },
    created_at: "2026-02-10T14:30:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    session_id: CHAT_SESSION_IDS.budget,
    role: "assistant",
    content:
      "For health programs in your Annual Investment Plan, I recommend allocating the budget based on priority areas:\n\n1. Preventive Health Services (40%) – Vaccination programs, health education, and community health initiatives\n2. Primary Healthcare (30%) – Medical supplies, equipment, and basic healthcare services\n3. Emergency Response (20%) – First aid kits, emergency medical services, and disaster health preparedness\n4. Health Infrastructure (10%) – Maintenance and improvement of health centers\n\nWould you like specific guidance on any of these categories?",
    citations: null,
    retrieval_meta: null,
    created_at: "2026-02-10T14:31:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000303",
    session_id: CHAT_SESSION_IDS.status,
    role: "assistant",
    content:
      "The system tracks project progress through timeline updates. You can review each project’s status, recent updates, and associated compliance checks from the Projects section.",
    citations: null,
    retrieval_meta: null,
    created_at: "2026-02-09T16:42:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000304",
    session_id: CHAT_SESSION_IDS.compliance,
    role: "assistant",
    content:
      "All AIP documents must include the updated procurement schedule, approved budget summaries, and signed compliance attestations prior to submission.",
    citations: null,
    retrieval_meta: null,
    created_at: "2026-01-18T10:05:00.000Z",
  },
];
