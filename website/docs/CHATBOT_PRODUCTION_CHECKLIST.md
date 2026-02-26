# Chatbot Production Checklist

## Security and Secret Hygiene
- Rotate `SUPABASE_SERVICE_ROLE_KEY` before production rollout.
- Rotate `SUPABASE_SERVICE_KEY` used by `aip-intelligence-pipeline`.
- Rotate `OPENAI_API_KEY`.
- Set and store `PIPELINE_INTERNAL_TOKEN` in your secret manager (do not hardcode).
- Confirm no real credentials are committed to git history.

## Environment Configuration
- Website:
  - `PIPELINE_API_BASE_URL`
  - `PIPELINE_INTERNAL_TOKEN`
- Pipeline:
  - `PIPELINE_INTERNAL_TOKEN`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `OPENAI_API_KEY`

## Database
- Apply `website/docs/sql/2026-02-24_chatbot_rag_global_scope.sql`.
- Verify `public.match_published_aip_chunks` executes with service role.
- Verify assistant citation check constraint blocks assistant inserts without citations.
- Verify `consume_chat_quota` and `purge_chat_data_older_than` execute with service role.

## Runtime Verification
- Confirm `/api/barangay/chat/messages` returns cited answers.
- Confirm default retrieval spans published AIPs globally.
- Confirm explicit scope prompts narrow retrieval (`our barangay`, `barangay X`, etc.).
- Confirm unresolved/ambiguous scope prompts return clarification refusal.
- Confirm city and citizen chatbot pages show "Coming Soon".
