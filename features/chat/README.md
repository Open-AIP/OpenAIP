# Chat Feature Guide

## A. Purpose
Persist user chat sessions and messages for an in-app assistant (RAG chatbot storage).

## B. UI Surfaces
Currently:
- No `app/` routes import `features/chat` yet (feature is present but not wired to a page).

Code surfaces:
- Repo contract: `lib/repos/chat/repo.ts`
- Repo entrypoints:
  - client-safe: `lib/repos/chat/repo.ts`
  - server-only: `lib/repos/chat/repo.server.ts`
- Mock adapter: `lib/repos/chat/repo.mock.ts`
- Supabase stub: `lib/repos/chat/repo.supabase.ts`

## C. Data Flow (diagram in text)
Future UI (page/component)
→ `getChatRepo()` (`lib/repos/chat/repo.ts` or `lib/repos/chat/repo.server.ts`)
→ `ChatRepo` interface (`lib/repos/chat/repo.ts`)
→ adapter:
  - today: `createMockChatRepo()` (`lib/repos/chat/repo.mock.ts`)
  - future: `createSupabaseChatRepo()` (`lib/repos/chat/repo.supabase.ts`)

## D. databasev2 Alignment
Relevant DBV2 tables:
- `public.chat_sessions`
- `public.chat_messages`

Key constraints & visibility rules:
- Sessions:
  - only authenticated users can access
  - user can access only their own sessions (admin can access all)
- Messages:
  - append-only (no update/delete policies; only insert/select)
  - client-side inserts are restricted to `role = 'user'` (assistant/system should be server-side)

How those rules should be enforced:
- Repository should only expose “append user message” for client usage.
- Any assistant/system message persistence must be implemented server-side using a service role route.

## E. Current Implementation (Mock)
- In-memory stores in `lib/repos/chat/repo.mock.ts` (seeded from `mocks/fixtures/chat/chat.fixture.ts`).
- `getChatRepo()` returns the mock repo only in dev (`NEXT_PUBLIC_APP_ENV=dev`).

## F. Supabase Swap Plan (Future-only)
1) Update repo selector to pick by environment:
- `lib/repos/chat/repo.server.ts` should return:
  - mock in `dev`
  - `createSupabaseChatRepo()` in non-dev

2) Method → table mapping:
- `listSessions(userId)` → `public.chat_sessions` where `user_id = userId` (RLS already enforces ownership)
- `getSession(sessionId)` → `public.chat_sessions` by id (RLS-gated)
- `createSession(userId, payload)` → insert into `public.chat_sessions`
- `renameSession(sessionId, title)` → update `public.chat_sessions.title`
- `listMessages(sessionId)` → select from `public.chat_messages` where `session_id = sessionId` ordered by `created_at`
- `appendUserMessage(sessionId, content)` → insert into `public.chat_messages` with `role='user'`

Server-side assistant messages:
- Create a server route that inserts into `public.chat_messages` with `role='assistant'|'system'` using service role.

## G. Testing Checklist
Manual:
- Create session, rename session, append user messages, list messages in order.

Automated:
- Existing tests: `tests/repo-smoke/chat/chat.repo.mock.test.ts`
- Add integration tests for Supabase adapter once implemented (ownership + append-only behavior).

## H. Gotchas / Pitfalls
- Do not allow the client to insert non-`user` roles; DBV2 RLS blocks it.
- “Append-only” means edit/delete UIs must be avoided or explicitly server-admin-only.
