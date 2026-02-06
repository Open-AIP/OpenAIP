# Supabase Migration Guide (Mock → DBV2)

This repo currently follows a “mock data + repo contracts” pattern in most features. The goal of the migration is to swap mock adapters for Supabase adapters **without changing UI behavior, routes, layouts, styling, or auth flows**.

## 1) Universal pattern (keep UI identical)

**Target architecture (per feature):**

UI (pages/components)
→ hooks/actions/services (or server actions)
→ **repo/service boundary**
→ repository interface (contract)
→ adapter implementation
  - mock adapter (today)
  - supabase adapter (future)

Practical rule:
- UI imports **selectors/services**, never a concrete adapter.
- Selectors decide which adapter to return (`dev` → mock; non-dev → supabase).

## 2) DBV2 rules: what must be enforced where

**RLS is the source of truth**, but you still want service-layer validation for clearer errors and predictable UX.

Recommended split:
- **Repo adapters**: translate method calls to SQL queries; rely on RLS for access control; apply explicit filters for UX (e.g., don’t even request drafts in a “public list”).
- **Service/usecase / server actions**: orchestrate multi-step flows (status transitions + inserts), validate preconditions, and convert DB errors into user-friendly messages.
- **UI**: disable/hide actions based on current state (defense-in-depth, not the only protection).

## 3) What must remain server-only (even after Supabase)

DBV2 explicitly expects some operations to be server-managed:
- Uploads to Storage and download gating (signed URLs): enforce via Next.js Route Handlers using service role; write metadata to `public.uploaded_files`.
- Chunking/embeddings writes: `public.aip_chunks`, `public.aip_chunk_embeddings` should be written by server pipelines only.
- AI artifact writes: `public.extraction_runs`, `public.extraction_artifacts` are typically pipeline-driven; keep writes server-only.
- Assistant/system chat messages: client inserts are restricted to `role='user'`; server should insert assistant/system messages.
- Audit logging: `public.activity_log` is server-only writes.

## 4) “Flip to Supabase” checklist (before enabling non-dev adapters)

1) **Actor context is correct**
   - Your auth layer must map the signed-in user to a `public.profiles` row (`profiles.id = auth.uid()`).
   - Role is one of: `citizen`, `barangay_official`, `city_official`, `municipal_official`, `admin`.
   - Scope binding respects DBV2 `chk_profiles_scope_binding`.

2) **Repo contracts are stable**
   - Do not change page/component call sites; adapt the Supabase adapter to return the same shapes used today.

3) **RLS is deployed**
   - Ensure DBV2 policies for `aips`, `projects`, detail tables, `feedback`, `aip_reviews`, `chat_*`, and `activity_log` are applied.

4) **Server-only routes exist (where required)**
   - Upload route handler: storage + `uploaded_files` insert, gated by `can_upload_aip_pdf(aip_id)`.
   - Download route handler: signed URL gated by AIP status/visibility.
   - Pipeline endpoints (optional): extraction, artifacts, chunks, embeddings.
   - Audit logger: service role insert into `activity_log`.

5) **Environment switching is explicit**
   - Each selector should choose mock vs supabase adapter using a single env source (e.g., `getAppEnv()`).

## 5) Feature → DBV2 mapping table

| Feature | Primary tables | Notes |
|---|---|---|
| AIP (`features/aip`) | `public.aips` | Visibility: non-draft public; drafts owner/admin. Lifecycle: `public.aip_status`. |
| Uploads (AIP PDFs) | `public.uploaded_files` + Storage | Storage access is server-managed; DBV2 provides `can_upload_aip_pdf(aip_id)` gate. |
| Projects (`features/projects`) | `public.projects` + `public.health_project_details` + `public.infrastructure_project_details` | Reads gated by parent AIP visibility; writes gated by `can_edit_aip`/`can_edit_project`. |
| Comments/Feedback (`features/feedback`) | `public.feedback` | Public read is **published-only**; write kinds are role-restricted; replies must match parent target. |
| Reviews (Submissions) (`features/submissions`) | `public.aips` + `public.aip_reviews` | Reviewer actions are jurisdiction-gated; `aip_reviews` is append-only for non-admin. |
| Chat (`features/chat`) | `public.chat_sessions` + `public.chat_messages` | Messages append-only; client inserts only `role='user'`. |
| Audit/logging (`features/audit`) | `public.activity_log` | Server-only writes; reads restricted (admin/all, official/self, citizen/none). |

## 6) Adapter implementation recipe (repeat per feature)

1) Identify the contract file (interface/type).
   - Example: `features/submissions/submissionsReview.repo.ts`

2) Create `*.supabase.ts` adapter implementing the contract.
   - Keep method names and return types identical.
   - Map each method to the DBV2 table(s) listed in the feature guide.

3) Update the selector to return the Supabase adapter in non-dev.
   - Keep the mock adapter as-is for dev/test iteration.

4) Keep orchestration in the service/server-action layer.
   - Example: Submissions uses `features/submissions/submissionsReview.actions.ts` to validate inputs and coordinate writes.

5) Validate against DBV2 invariants.
   - Draft visibility, role/scope binding, status transitions, published-only public feedback, append-only tables.

