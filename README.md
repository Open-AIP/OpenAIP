# OpenAIP
OpenAIP is a monorepo for a role-based LGU web platform and an AI pipeline that ingests AIP PDFs, extracts structured project data, and writes validated results back to Supabase.

- Multi-portal Next.js app for `citizen`, `barangay`, `city`, and `admin` roles
- AIP PDF upload flow with queueing and live extraction progress
- Python pipeline worker for extraction, validation, summarization, and categorization
- Supabase-backed auth, Postgres, storage, and realtime updates
- Review/revision workflows for AIP and project-level feedback

## Table of Contents
- [Demo / Screenshots](#demo--screenshots)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Database & Migrations](#database--migrations)
- [Auth & Authorization](#auth--authorization)
- [Storage / File Handling](#storage--file-handling)
- [Testing & Quality](#testing--quality)
- [Deployment](#deployment)
- [Security](#security)
- [Observability](#observability)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Maintainers / Contact](#maintainers--contact)

## Demo / Screenshots
![OpenAIP Logo](website/public/brand/logo.svg)

## Tech Stack
| Area | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI |
| Web Backend | Next.js Route Handlers + Server Components/Actions |
| Pipeline Backend | FastAPI + Python 3.11 worker/service package (`openaip-pipeline`) |
| Database | Supabase Postgres |
| Auth | Supabase Auth + role-based route gating |
| Storage | Supabase Storage (`aip-pdfs`, `aip-artifacts`) |
| Realtime | Supabase Realtime on `public.extraction_runs` |
| AI/ML | OpenAI (`gpt-5.2`, `text-embedding-3-large`), LangChain OpenAI |
| Tooling | npm, Vitest, ESLint, pytest, Ruff, Pyright, Docker Compose |

## Architecture Overview
```text
Browser (Citizen/LGU/Admin)
    |
    v
Next.js app (website/app)
    |-- Supabase session + role gate (website/proxy.ts, lib/supabase/proxy.ts)
    |-- Upload API routes (website/app/api/**/aips/upload/route.ts)
    v
Supabase (Auth + Postgres + Storage)
    |-- uploaded_files, extraction_runs, extraction_artifacts, projects
    |-- storage bucket: aip-pdfs
    v
Python worker (aip-intelligence-pipeline)
    |-- claims queued extraction_runs
    |-- extract -> validate -> summarize -> categorize
    |-- writes artifacts and upserts projects
    |-- optional RAG trace
    v
Web UI reads status + subscribes to realtime progress
```

Core data flow:
1. User uploads a PDF from the web app.
2. Web API stores file metadata and queues a run in `public.extraction_runs`.
3. Worker claims the queued run, downloads the PDF via signed URL, processes stages, and writes outputs to DB/storage.
4. UI reads/polls/subscribes to run progress and displays final AIP/project data.

## Project Structure
| Path | Responsibility |
|---|---|
| `website/app` | Next.js routes (citizen/LGU/admin) and API route handlers |
| `website/features` | Feature modules (AIP, projects, submissions, audit, feedback, admin) |
| `website/lib` | Repo layer, Supabase clients, domain logic, typed DB contracts |
| `website/docs/sql` | Database schema baseline + incremental SQL patches |
| `website/docs/SUPABASE_MIGRATION.md` | Supabase migration guidance and adapter strategy |
| `website/tests` | Repo-smoke and typecheck tests |
| `aip-intelligence-pipeline/src/openaip_pipeline/api` | FastAPI app and run endpoints |
| `aip-intelligence-pipeline/src/openaip_pipeline/worker` | Queue polling and stage processor |
| `aip-intelligence-pipeline/src/openaip_pipeline/services` | Extraction/validation/summarization/categorization/RAG logic |
| `aip-intelligence-pipeline/src/openaip_pipeline/adapters/supabase` | Supabase REST/storage adapters and repository |
| `aip-intelligence-pipeline/src/openaip_pipeline/resources` | Prompts, schemas, rules, version manifest |
| `aip-intelligence-pipeline/tests` | Python unit/smoke tests |
| `aip-intelligence-pipeline/docker-compose.yml` | API + worker container orchestration |

## Getting Started
### Prerequisites
- Node.js (Next.js 16-compatible; Node 20+ recommended)
- npm (repo includes `website/package-lock.json`)
- Python 3.11+
- Supabase project (URL, publishable/anon key, service role key)
- OpenAI API key (for worker processing)
- Docker Desktop (optional, for containerized pipeline)

### Installation
```bash
# 1) Clone and enter repo
git clone https://github.com/CjPadua/open-aip.git
cd open-aip

# 2) Install website dependencies
cd website
npm install
cd ..

# 3) Install pipeline dependencies (with dev tools)
cd aip-intelligence-pipeline
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
cd ..
```

### Environment Variables
Copy template files:
```bash
# macOS/Linux
cp website/.env.local.example website/.env.local
cp aip-intelligence-pipeline/.env.example aip-intelligence-pipeline/.env
```

```powershell
# Windows PowerShell
Copy-Item website/.env.local.example website/.env.local
Copy-Item aip-intelligence-pipeline/.env.example aip-intelligence-pipeline/.env
```

`website/.env.local` (safe example):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-or-anon-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<optional-fallback-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_STORAGE_ARTIFACT_BUCKET=aip-artifacts

BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=dev
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_FEEDBACK_DEBUG=0
NEXT_PUBLIC_TEMP_ADMIN_BYPASS=false
NEXT_PUBLIC_API_BASE_URL=
```

`aip-intelligence-pipeline/.env` (safe example):
```env
OPENAI_API_KEY=<openai-api-key>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<supabase-service-role-key>
SUPABASE_STORAGE_ARTIFACT_BUCKET=aip-artifacts

PIPELINE_MODEL=gpt-5.2
PIPELINE_EMBEDDING_MODEL=text-embedding-3-large
PIPELINE_BATCH_SIZE=25
PIPELINE_WORKER_POLL_SECONDS=3
PIPELINE_WORKER_RUN_ONCE=false
PIPELINE_PROGRESS_HEARTBEAT_SECONDS=5
PIPELINE_SUMMARIZE_EXPECTED_SECONDS=60
PIPELINE_ARTIFACT_INLINE_MAX_BYTES=32768
PIPELINE_ENABLE_RAG=false
PIPELINE_RAG_TRACE_QUERY=
PIPELINE_DEV_ROUTES=false

PIPELINE_VERSION=
PIPELINE_PROMPT_SET_VERSION=v1.0.0
PIPELINE_SCHEMA_VERSION=v1.0.0
PIPELINE_RULESET_VERSION=v1.0.0

API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

Website env reference:
| Variable | Required | Visibility | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client-exposed | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | Client-exposed | Browser/server SSR Supabase key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Client-exposed | Fallback if publishable key not set |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only | Elevated server actions (uploads/admin ops) |
| `SUPABASE_STORAGE_ARTIFACT_BUCKET` | No | Server-only | Artifact bucket used for strict draft delete cleanup (default `aip-artifacts`) |
| `BASE_URL` | Yes | Server-only | Absolute app origin for auth page helpers |
| `NEXT_PUBLIC_APP_ENV` | No | Client-exposed | `dev`/`staging`/`prod`; controls mock selection |
| `NEXT_PUBLIC_USE_MOCKS` | No | Client-exposed | Force mock repos when `true` |
| `NEXT_PUBLIC_FEEDBACK_DEBUG` | No | Client-exposed | Feedback debug toggle (`1` enables) |
| `NEXT_PUBLIC_TEMP_ADMIN_BYPASS` | No | Client-exposed | Dev-only bypass toggle |
| `NEXT_PUBLIC_API_BASE_URL` | No | Client-exposed | Optional API base override |

\* Set at least one of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Pipeline env reference:
| Variable | Required | Visibility | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes (worker/local run) | Server-only | OpenAI calls for processing stages |
| `SUPABASE_URL` | Yes (queue/API) | Server-only | Supabase REST/storage base |
| `SUPABASE_SERVICE_KEY` | Yes (queue/API) | Server-only | Service key for DB/storage writes |
| `SUPABASE_STORAGE_ARTIFACT_BUCKET` | No | Server-only | Artifact bucket (default `aip-artifacts`) |
| `PIPELINE_MODEL` | No | Server-only | Default LLM model |
| `PIPELINE_EMBEDDING_MODEL` | No | Server-only | Embedding model |
| `PIPELINE_BATCH_SIZE` | No | Server-only | Categorization batching |
| `PIPELINE_WORKER_POLL_SECONDS` | No | Server-only | Queue poll interval |
| `PIPELINE_WORKER_RUN_ONCE` | No | Server-only | Exit after one polling cycle |
| `PIPELINE_PROGRESS_HEARTBEAT_SECONDS` | No | Server-only | Progress heartbeat interval |
| `PIPELINE_SUMMARIZE_EXPECTED_SECONDS` | No | Server-only | Summarization progress estimate |
| `PIPELINE_ARTIFACT_INLINE_MAX_BYTES` | No | Server-only | Inline vs storage threshold |
| `PIPELINE_ENABLE_RAG` | No | Server-only | Enable optional RAG trace stage |
| `PIPELINE_RAG_TRACE_QUERY` | No | Server-only | Query text used when RAG trace is enabled |
| `PIPELINE_DEV_ROUTES` | No | Server-only | Enables `/v1/runs/dev/local` |
| `PIPELINE_VERSION` | No | Server-only | Overrides pipeline version hash |
| `PIPELINE_PROMPT_SET_VERSION` | No | Server-only | Prompt set version override |
| `PIPELINE_SCHEMA_VERSION` | No | Server-only | Schema version override |
| `PIPELINE_RULESET_VERSION` | No | Server-only | Ruleset version override |
| `API_HOST` | No | Server-only | FastAPI bind host (default `0.0.0.0`) |
| `API_PORT` | No | Server-only | FastAPI port (default `8000`) |
| `LOG_LEVEL` | No | Server-only | API logging level |

### Run Locally (Dev)
1. Apply DB SQL and create storage buckets (see [Database & Migrations](#database--migrations)).
2. Start website:
```bash
cd website
npm run dev
```
3. Start pipeline API (new terminal):
```bash
cd aip-intelligence-pipeline
# activate venv first
openaip-api
```
4. Start pipeline worker (new terminal):
```bash
cd aip-intelligence-pipeline
# activate venv first
openaip-worker
```

Expected outcomes:
- Web app: `http://localhost:3000`
- Pipeline API health: `http://localhost:8000/health`
- Worker logs: `[WORKER] started`
- Uploading an AIP PDF queues a run and updates progress in UI.

## Scripts
Website (`website/package.json`):
| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint checks |
| `npm run test:ui` | Run Vitest UI tests once |
| `npm run test:ui:watch` | Run Vitest in watch mode |

Additional website quality commands:
```bash
cd website
npx tsc --noEmit
node scripts/repo-smoke/run.js
```

Pipeline entry points (`aip-intelligence-pipeline/pyproject.toml`):
| Command | Description |
|---|---|
| `openaip-api` | Run FastAPI service |
| `openaip-worker` | Run queue worker |
| `openaip-cli` | CLI utilities (`run-local`, `worker`, `api`, `versions`, `validate-rules`, `manifest`) |

Pipeline quality commands:
```bash
cd aip-intelligence-pipeline
pytest -q
ruff check src tests
pyright
```

## Database & Migrations
This repo stores SQL migrations in `website/docs/sql` (no Supabase CLI migration directory is committed).

Recommended workflow:
1. Fresh project: run `website/docs/sql/database-v2.sql` in Supabase SQL Editor.
2. Existing project: apply dated patches in ascending order only if your DB predates them:
   - `website/docs/sql/2026-02-13_account_admin_hardening.sql`
   - `website/docs/sql/2026-02-15-projects-financial-expenses.sql`
   - `website/docs/sql/2026-02-19_extraction_run_progress.sql`
   - `website/docs/sql/2026-02-20_submissions_claim_review.sql`
   - `website/docs/sql/2026-02-21_city_aip_project_column_and_publish.sql`
   - `website/docs/sql/2026-02-21_extraction_runs_realtime.sql`
   - `website/docs/sql/2026-02-22_aip_publish_embed_categorize_trigger.sql`
   - `website/docs/sql/2026-02-22_aip_publish_embed_categorize_logging_status.sql`
3. Create Supabase storage buckets manually:
   - `aip-pdfs` (uploaded source PDFs)
   - `aip-artifacts` (pipeline artifacts when payload exceeds inline threshold)

### Publish-Time Categorize Embedding
When an AIP transitions to `published`, DB trigger `trg_aip_published_embed_categorize` asynchronously calls the Edge Function `embed_categorize_artifact` via `pg_net`.

Files added for this flow:
- SQL patch: `website/docs/sql/2026-02-22_aip_publish_embed_categorize_trigger.sql`
- SQL patch (logging/status + retry RPC): `website/docs/sql/2026-02-22_aip_publish_embed_categorize_logging_status.sql`
- Edge Function: `supabase/functions/embed_categorize_artifact/index.ts`

Required configuration:
1. Edge Function environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `EMBED_CATEGORIZE_JOB_SECRET`
2. DB setting (required):
   - `app.embed_categorize_url` = full Edge Function invoke URL (for example: `https://<project-ref>.supabase.co/functions/v1/embed_categorize_artifact`)
3. Trigger secret (recommended):
   - Store in Vault with name `embed_categorize_job_secret` (the trigger reads `vault.decrypted_secrets` first)
   - Use the same value as `EMBED_CATEGORIZE_JOB_SECRET`
4. Local/dev fallback secret (optional):
   - `app.embed_categorize_secret` if Vault is unavailable

Example SQL config:
```sql
alter database postgres set app.embed_categorize_url = 'https://<project-ref>.supabase.co/functions/v1/embed_categorize_artifact';
alter database postgres set app.embed_categorize_secret = 'dev-only-secret';
```

Local/hosted test flow:
1. Deploy or serve the Edge Function with JWT verification disabled for trigger-origin calls.
2. Ensure `app.embed_categorize_url` and secret config are set.
3. Publish an AIP (`under_review` -> `published`).
4. Verify output rows in:
   - `public.aip_chunks` with `metadata.source = 'categorize_artifact'`
   - `public.aip_chunk_embeddings` with `embedding_model = 'text-embedding-3-large'`

Observe indexing status:
```sql
select
  id,
  aip_id,
  stage,
  status,
  overall_progress_pct,
  progress_message,
  error_code,
  error_message,
  started_at,
  finished_at,
  created_at
from public.extraction_runs
where stage = 'embed'
order by created_at desc;
```

Edge Function logs:
```bash
supabase functions logs --name embed_categorize_artifact
```

Manual/retry indexing:
- API: `POST /api/barangay/aips/[aipId]/embed/retry`
- API: `POST /api/city/aips/[aipId]/embed/retry`
- DB dispatcher RPC used by retry routes: `public.dispatch_embed_categorize_for_aip(p_aip_id uuid)`
- Route behavior:
  - Dispatch allowed when latest embed state is `missing`, `failed`, or `succeeded` with skip message (`No categorize artifact; skipping.`)
  - Returns `409` when indexing is already running or already ready
  - Returns `503` when dispatch config is missing (`app.embed_categorize_url` / job secret)

Edge-function unit-ish tests:
```bash
deno test --allow-env supabase/functions/embed_categorize_artifact/index.test.ts
```

Related docs:
- `website/docs/SUPABASE_MIGRATION.md`
- `website/docs/sql/database-v2.sql`
- `aip-intelligence-pipeline/src/openaip_pipeline/resources/manifests/pipeline_versions.yaml`

## Auth & Authorization
- Session/auth gate is enforced in `website/proxy.ts` via `website/lib/supabase/proxy.ts`.
- Role mapping uses DB roles: `citizen`, `barangay_official`, `city_official`, `municipal_official`, `admin`.
- Route-role mapping is implemented in `website/lib/auth/roles.ts`.
- Protected upload/retry APIs are under:
  - `website/app/api/barangay/aips/**`
  - `website/app/api/city/aips/**`
- Authorization checks include role/scope checks and Supabase RPCs (`can_upload_aip_pdf`, `can_edit_aip`).
- Row-level security policies are defined in `website/docs/sql/database-v2.sql` for major tables (`aips`, `projects`, `feedback`, `aip_reviews`, `chat_*`, `activity_log`, `extraction_*`).

## Storage / File Handling
- Upload route handlers accept PDF only, max 10 MB.
- Source files are uploaded to bucket `aip-pdfs` and metadata is written to `public.uploaded_files`.
- Extraction runs are queued in `public.extraction_runs`.
- Worker downloads source PDFs using signed URLs and writes stage outputs to `public.extraction_artifacts`.
- Artifact payloads are stored directly in `artifact_json` using the stage contract (`aip_artifact_v1.x.x`).
- Web repo generates short-lived signed URLs when serving PDF references (10-minute TTL in current implementation).

## Testing & Quality
Website:
```bash
cd website
npm run lint
npm run test:ui
npx tsc --noEmit
node scripts/repo-smoke/run.js
```

Pipeline:
```bash
cd aip-intelligence-pipeline
# activate venv and ensure dev extras are installed
pytest -q
ruff check src tests
pyright
```

Current test coverage in repo includes:
- UI/component and hook tests under `website/features/**/*.test.ts(x)`
- Repo smoke checks under `website/tests/repo-smoke/**`
- Pipeline smoke/resource/rules/worker-sanitization tests under `aip-intelligence-pipeline/tests/**`

## Deployment
Website (Next.js):
```bash
cd website
npm ci
npm run build
npm run start
```

Pipeline (Docker Compose, API + worker):
```bash
cd aip-intelligence-pipeline
docker compose up --build
```

Pipeline (separate images):
```bash
cd aip-intelligence-pipeline
docker build -f Dockerfile.api -t openaip-pipeline-api .
docker build -f Dockerfile.worker -t openaip-pipeline-worker .
```

Production runtime requirements:
- Website envs: `NEXT_PUBLIC_SUPABASE_URL`, publishable/anon key, `SUPABASE_SERVICE_ROLE_KEY`, `BASE_URL` (optional: `SUPABASE_STORAGE_ARTIFACT_BUCKET`)
- Pipeline envs: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Supabase project with DB schema and storage buckets in place
- Outbound network access from pipeline runtime to Supabase + OpenAI

Common hosting options for this codebase:
- Website: any Next.js-capable Node host
- Pipeline: any container host running API + worker
- Data/auth/storage: Supabase managed project

## Security
- Auth/session enforcement is centralized in `website/lib/supabase/proxy.ts`.
- Keep service keys server-only:
  - `SUPABASE_SERVICE_ROLE_KEY` (`website`)
  - `SUPABASE_SERVICE_KEY` (`aip-intelligence-pipeline`)
  - `OPENAI_API_KEY` (`aip-intelligence-pipeline`)
- Never expose server secrets as `NEXT_PUBLIC_*`.
- `.env.local` and `.env` are ignored by git; do not commit generated env files.
- Pipeline error sanitization redacts secrets before persisting failure artifacts (`_sanitize_error` in `worker/processor.py`).
- Vulnerability reporting: use private security reporting channels (GitHub Security Advisories if enabled) and notify maintainers directly.

## Observability
- Worker lifecycle logs are emitted to stdout (`[WORKER] started`, claimed/succeeded/failed run logs).
- API health endpoints:
  - `GET /` returns service status
  - `GET /health` returns status + version
- Run progress is persisted on `public.extraction_runs`:
  - `overall_progress_pct`
  - `stage_progress_pct`
  - `progress_message`
  - `progress_updated_at`
- UI realtime subscription for run updates is implemented in `website/features/aip/hooks/use-extraction-runs-realtime.ts`.
- Realtime publication setup is handled by `website/docs/sql/2026-02-21_extraction_runs_realtime.sql`.

## Troubleshooting
| Issue | Likely Cause | Fix |
|---|---|---|
| `Missing NEXT_PUBLIC_SUPABASE_URL...` at runtime | Supabase public env vars not set in `website/.env.local` | Set `NEXT_PUBLIC_SUPABASE_URL` and one of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, then restart `npm run dev` |
| `BASE_URL environment variable is not configured` on auth pages | `BASE_URL` missing | Set `BASE_URL=http://localhost:3000` for local dev |
| Upload endpoint returns `Unauthorized` or `You cannot upload for this AIP right now.` | Role/scope mismatch or DB function/policies not applied | Ensure user profile role/scope is correct and SQL from `website/docs/sql/database-v2.sql` is applied |
| Upload fails with storage error (`bucket not found` / permissions) | Missing `aip-pdfs` bucket or storage misconfiguration | Create `aip-pdfs` bucket in Supabase Storage; verify service role key is valid |
| Draft delete fails with `Failed to delete one or more AIP files from storage. Draft was not deleted.` | Strict delete gate blocked DB delete because one or more storage objects could not be removed | Verify `aip-pdfs`/artifact bucket objects still exist, service role key has storage delete permission, and `SUPABASE_STORAGE_ARTIFACT_BUCKET` matches your artifact bucket |
| Worker exits/fails with progress-column error | DB missing run progress columns | Apply `website/docs/sql/2026-02-19_extraction_run_progress.sql` (or full `database-v2.sql`) |
| UI does not receive live progress updates | Realtime publication not configured | Apply `website/docs/sql/2026-02-21_extraction_runs_realtime.sql` |
| Runs stay `queued` forever | Worker not running or cannot claim runs | Start `openaip-worker`; verify pipeline `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` |
| Worker fails with `OPENAI_API_KEY not found` | Missing OpenAI secret in pipeline env | Set `OPENAI_API_KEY` in `aip-intelligence-pipeline/.env` |
| `POST /v1/runs/dev/local` returns 403 | Dev routes disabled | Set `PIPELINE_DEV_ROUTES=true` in pipeline env |
| `pytest`/`ruff`/`pyright` command not found | Dev extras not installed | Reinstall with `python -m pip install -e ".[dev]"` |
| `Fatal error in launcher` when running `pip` inside pipeline venv | Venv launchers still point to old folder path after rename | Recreate `.venv`, then use `python -m pip install --upgrade pip` and `python -m pip install -e ".[dev]"` |

## Contributing
Branch strategy (aligned with existing branch layout in repo):
1. Start from `integration` for feature work.
2. Use short-lived branches like `feature/<scope>-<name>` or `fix/<scope>-<name>`.
3. Merge feature/fix branches into `integration`.
4. Promote `integration` into `main` for release.

PR checklist:
- [ ] Scope is focused and linked to an issue/task
- [ ] `website`: `npm run lint`, `npm run test:ui`, and `npx tsc --noEmit` pass
- [ ] `aip-intelligence-pipeline`: `pytest -q` (and `ruff`/`pyright` when applicable) pass
- [ ] No secrets or real credentials are committed
- [ ] SQL/schema changes are documented in `website/docs/sql`
- [ ] README/docs are updated for behavior, env, or workflow changes
- [ ] UI/API changes include at least one validation path for reviewers

## License
TBD (no repository `LICENSE` file is currently committed).

## Maintainers / Contact
- Maintainers: TBD
- Engineering contact: `engineering@your-org.example` (placeholder)
- Security contact: `security@your-org.example` (placeholder)
