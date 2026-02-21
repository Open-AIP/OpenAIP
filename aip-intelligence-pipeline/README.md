# OpenAIP Pipeline Service

Production-grade Python service for AIP extraction workflows, including extraction, validation, summarization, categorization, and optional RAG traces.

## Install

```bash
pip install -e .
```

## Run

API:

```bash
openaip-api
```

Worker:

```bash
openaip-worker
```

Dev CLI local file run:

```bash
openaip-cli run-local --pdf-path data/aips/sample.pdf --scope barangay
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

## Artifacts and versioning

Definition artifacts (repo-tracked):

- `src/openaip_pipeline/resources/prompts`
- `src/openaip_pipeline/resources/schemas`
- `src/openaip_pipeline/resources/rules`
- `src/openaip_pipeline/resources/manifests/pipeline_versions.yaml`

Execution artifacts (Supabase source of truth):

- Per-stage payloads stored in `public.extraction_artifacts`
- Small payloads inline in `artifact_json.data`
- Large payloads uploaded to Supabase Storage and referenced via `artifact_json.storage_path`
- Metadata recorded in `artifact_json.meta` including:
  - `pipeline_version`
  - `prompt_set_version`
  - `schema_version`
  - `ruleset_version`
  - `model_id`
  - `embedding_model_id`
  - prompt snapshot identifiers (`prompt_id`, `prompt_version`)

## Dev-local output policy

- Production worker does not depend on local `outputs/`.
- CLI local runs write to `data/outputs/`.

