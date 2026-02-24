# OpenAIP Pipeline Service

Production-grade Python service for AIP extraction workflows, including extraction, validation, summarization, categorization, and optional RAG traces.

## Setup (first time)

Run these commands one by one inside `aip-intelligence-pipeline`.

```powershell
cd aip-intelligence-pipeline
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
# then edit .env and set required keys
```

Required keys in `.env`:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## Run

API (terminal 1):

```powershell
cd aip-intelligence-pipeline
.\.venv\Scripts\Activate.ps1
openaip-api
```

Worker (terminal 2):

```powershell
cd aip-intelligence-pipeline
.\.venv\Scripts\Activate.ps1
openaip-worker
```

Dev CLI local file run:

```powershell
cd aip-intelligence-pipeline
.\.venv\Scripts\Activate.ps1
openaip-cli run-local --pdf-path data/aips/sample.pdf --scope barangay
```

If command aliases are not detected, use module mode:

```powershell
.\.venv\Scripts\python.exe -m openaip_pipeline.api.app
.\.venv\Scripts\python.exe -m openaip_pipeline.worker.runner
```

## Troubleshooting

If you renamed this folder and get a `Fatal error in launcher` from `pip`, recreate `.venv` because old launchers still point to the previous path:

```powershell
deactivate
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

## Required env vars

Required for worker and enqueue/status API:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Required for extraction stages:

- `OPENAI_API_KEY`

Common optional runtime vars:

- `PIPELINE_MODEL` (default `gpt-5.2`)
- `PIPELINE_EMBEDDING_MODEL` (default `text-embedding-3-large`)
- `PIPELINE_BATCH_SIZE` (default `25`)
- `PIPELINE_WORKER_POLL_SECONDS` (default `3`)
- `PIPELINE_WORKER_RUN_ONCE` (default `false`)
- `PIPELINE_ARTIFACT_INLINE_MAX_BYTES` (default `32768`)
- `SUPABASE_STORAGE_ARTIFACT_BUCKET` (default `aip-artifacts`)
- `PIPELINE_DEV_ROUTES` (default `false`)
- `PIPELINE_ENABLE_RAG` (default `false`)

## Validation resources

Barangay validation prompt source:
- `src/openaip_pipeline/resources/prompts/validation/barangay_system.txt`

Barangay rules metadata source:
- `src/openaip_pipeline/resources/rules/barangay.rules.json`

City validation prompt source:
- `src/openaip_pipeline/resources/prompts/validation/city_system.txt`

City rules metadata source:
- `src/openaip_pipeline/resources/rules/city.rules.json`

Quick rules inspection:

```powershell
openaip-cli validate-rules --scope barangay
openaip-cli validate-rules --scope city
```

## Extraction prompt resources

Barangay extraction prompt sources:
- `src/openaip_pipeline/resources/prompts/extraction/barangay_system.txt`
- `src/openaip_pipeline/resources/prompts/extraction/barangay_user.txt`

City extraction prompt sources:
- `src/openaip_pipeline/resources/prompts/extraction/city_system.txt`
- `src/openaip_pipeline/resources/prompts/extraction/city_user.txt`

These prompt files are runtime source-of-truth for extraction instructions.

## Summarization prompt resources

Summarization prompt source:
- `src/openaip_pipeline/resources/prompts/summarization/system.txt`

This prompt file is runtime source-of-truth for summarization instructions.

## Categorization prompt resources

Categorization prompt source:
- `src/openaip_pipeline/resources/prompts/categorization/system.txt`

This prompt file is runtime source-of-truth for categorization instructions.

## Artifacts and versioning

Definition artifacts (repo-tracked):

- `src/openaip_pipeline/resources/prompts`
- `src/openaip_pipeline/resources/schemas`
- `src/openaip_pipeline/resources/rules`
- `src/openaip_pipeline/resources/manifests/pipeline_versions.yaml`

Execution artifacts (Supabase source of truth):

- Per-stage payloads stored in `public.extraction_artifacts`
- Stage payloads are stored directly in `artifact_json` using schema `aip_artifact_v1.x.x`
- `artifact_text` stores summarize/categorize summary text for convenience reads

## Dev-local output policy

- Production worker does not depend on local `outputs/`.
- CLI local runs write to `data/outputs/`.
