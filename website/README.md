# OpenAIP Website

Next.js 16 web app for citizen, barangay, city, and admin portals.

For full monorepo setup (pipeline, database, and deployment), use the root guide:
- `../README.md`

## Quickstart

1. Install dependencies:
```bash
npm install
```

2. Create local env file:
```powershell
Copy-Item .env.local.example .env.local
```

3. Start dev server:
```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Environment Flags

- `NEXT_PUBLIC_APP_ENV`
  - Allowed: `dev`, `staging`, `prod`
  - Default: `dev`
- `NEXT_PUBLIC_USE_MOCKS`
  - `true` forces mock repositories
  - If unset, mock mode is enabled when `NEXT_PUBLIC_APP_ENV=dev`

Repository selection is centralized in:
- `lib/config/appEnv.ts`
- `lib/repos/_shared/selector.ts`

## Quality Checks

```bash
npm run lint
npm run test:ui
npx tsc --noEmit
node scripts/repo-smoke/run.js
```

## Notes

- Database schema and SQL patches are in `docs/sql`.
- Canonical schema file is `docs/sql/database-v2.sql`.
- The mirrored copy `docs/databasev2.txt` is kept synchronized with the canonical SQL file.
