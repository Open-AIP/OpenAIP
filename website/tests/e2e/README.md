# Playwright E2E (ISO Evidence)

This folder contains Playwright end-to-end tests for ISO/IEC 25010 evidence generation:

- Functional Suitability (`evidence-pack/01-functional/playwright-report/`)
- Compatibility (`evidence-pack/03-compatibility/playwright-matrix.md`)

## Prerequisites

- Install dependencies in `website/`
- Staging dataset is freshly reseeded before each run
- Distinct valid PDF files per project are available to avoid duplicate SHA-256 upload rejection

## Required Environment Variables

- `E2E_BASE_URL` (example: `https://<vercel-preview-url>`)
- `E2E_CITIZEN_EMAIL`
- `E2E_CITIZEN_PASSWORD`
- `E2E_BARANGAY_EMAIL`
- `E2E_BARANGAY_PASSWORD`
- `E2E_CITY_EMAIL`
- `E2E_CITY_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Optional:

- `E2E_STORAGE_STATE_DIR` (default: `website/.playwright/.auth`)
- `E2E_COMMIT_SHA` (falls back to `GITHUB_SHA` for matrix)

## Project-Specific Inputs

Distinct PDF paths per project:

- `E2E_AIP_PDF_PATH_CHROMIUM`
- `E2E_AIP_PDF_PATH_FIREFOX`
- `E2E_AIP_PDF_PATH_PIXEL5`
- `E2E_AIP_PDF_PATH_IPHONE13`

Project scenario JSON paths:

- `E2E_SCENARIO_CHROMIUM`
- `E2E_SCENARIO_FIREFOX`
- `E2E_SCENARIO_PIXEL5`
- `E2E_SCENARIO_IPHONE13`

Use `tests/e2e/scenarios/scenario.example.json` as the schema template.

## Scenario Contract

A scenario file must include:

- `aipWorkflow.uploadFiscalYear`
- `aipWorkflow.submissionAipId`
- `aipWorkflow.publishedAipId`
- `aipWorkflow.revisionComment`
- `aipWorkflow.resubmissionReply`
- `citizen.feedbackMessage`
- `admin.usageControls.chatbotMaxRequests`
- `admin.usageControls.chatbotTimeWindow` (`per_hour` or `per_day`)
- `admin.createLguAccount.fullName`
- `admin.createLguAccount.email`
- `admin.createLguAccount.role` (`barangay_official`, `city_official`, `municipal_official`)
- `admin.createLguAccount.lguKey` (format: `<scopeType>:<scopeId>`)
- `admin.addLgu.*` (type/name/code plus optional dependent IDs)

## Run Commands

From `website/`:

```bash
npm run e2e:install
npm run e2e
npm run e2e:ui
npm run e2e:report
```

`npm run e2e` always attempts matrix generation after the Playwright run and keeps the Playwright exit code.

## Workflows Covered

1. Barangay upload -> extraction complete -> validation visible
2. Barangay submit AIP to city
3. City request revision
4. Barangay resubmit revised AIP
5. City approve/publish AIP
6. Citizen browse published AIP details/projects/budget allocation
7. Citizen submit feedback
8. Admin save usage controls and verify value
9. Admin audit logs page + recent entries
10. Admin create LGU account (idempotent existing-or-created)
11. Admin add LGU entity (idempotent existing-or-created)
