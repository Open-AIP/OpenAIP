# Feature Template Map

This project uses three feature templates to keep folder layout predictable.

## Templates

- `full-feature`
  - Intended for domains with active UI composition and local feature modules.
  - Typical folders: `components/`, `views/`, `hooks/`, `types/`, optional `actions/`, `dialogs/`.
- `view-only`
  - Intended for thin feature surfaces that mostly expose route-facing views/types.
  - Typical folders: `views/` and/or `types/`.
- `route-shell`
  - Intended for feature umbrellas that compose subfeatures and provide boundaries only.
  - Typical folders: child feature folders (`city/`, `barangay/`, etc.) and shared boundaries.

## Classification

| Feature | Template |
|---|---|
| `account` | `full-feature` |
| `admin` | `route-shell` |
| `aip` | `full-feature` |
| `audit` | `view-only` |
| `chat` | `full-feature` |
| `citizen` | `route-shell` |
| `city` | `view-only` |
| `dashboard` | `route-shell` |
| `feedback` | `full-feature` |
| `projects` | `full-feature` |
| `shared` | `route-shell` |
| `submissions` | `full-feature` |

## Boundaries

- Every top-level `features/<name>/` folder must keep:
  - `index.ts` (boundary export)
  - `README.md` (ownership + intent)
- Root-level source files are allowed only when they are compatibility boundaries (re-exports).
