# Chat Feature Guide

## A. Purpose
Provide the LGU chatbot experience with persisted chat sessions/messages and server-side answer generation.

## B. UI Surfaces
Route wiring:
- Active UI: `app/(lgu)/barangay/(authenticated)/chatbot/page.tsx`
- Placeholders (not fully rolled out):  
  - `app/(lgu)/city/(authenticated)/chatbot/page.tsx`  
  - `app/(citizen)/chatbot/page.tsx`

Feature files:
- `features/chat/views/lgu-chatbot-view.tsx`
- `features/chat/hooks/use-lgu-chatbot.ts`
- `features/chat/components/*`

API routes:
- `app/api/barangay/chat/sessions/route.ts`
- `app/api/barangay/chat/sessions/[sessionId]/messages/route.ts`
- `app/api/barangay/chat/messages/route.ts`

## C. Data Flow
UI hook (`use-lgu-chatbot`)
-> barangay chat API routes
-> `getChatRepo()` from `lib/repos/chat/repo.server.ts`
-> selector-based adapter:
  - mock: `lib/repos/chat/repo.mock.ts`
  - supabase: `lib/repos/chat/repo.supabase.ts`

Notes:
- `lib/repos/chat/repo.ts` is client-safe and throws outside mock mode.
- server route handlers are the source of truth for assistant/system message writes.

## D. databasev2 Alignment
Primary tables:
- `public.chat_sessions`
- `public.chat_messages`

Key rules:
- sessions are user-scoped (RLS ownership checks),
- messages are append-only,
- client-side writes are restricted to `role='user'`.

## E. Current Implementation Status
- Barangay chatbot route is active.
- Session and user-message persistence support mock and Supabase modes.
- Assistant responses are produced in `app/api/barangay/chat/messages/route.ts` and persisted server-side.
- City and citizen chatbot pages are intentionally placeholder-only at this time.

## F. Testing Checklist
Manual:
- Create session, send message, reload, and confirm history persists.
- Confirm unauthorized roles receive `401` from barangay chat APIs.
- Confirm placeholder routes render for city/citizen chatbot paths.

Automated:
- `features/chat/*.test.ts`
- `features/chat/components/*.test.tsx`

## G. Pitfalls
- Do not expose assistant/system writes to client-side direct inserts.
- Keep role/scope authorization checks aligned with route-level guards.
