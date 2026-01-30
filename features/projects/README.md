# Projects Feature

## Overview

The **Projects feature** manages health and infrastructure projects with complete data independence from other features (especially AIP).

## Data Isolation Rules

**CRITICAL**: Projects data is self-contained and NOT sourced from AIP feature.

- ✅ **DO**: Use Projects mocks from `features/projects/mocks.ts`
- ✅ **DO**: Use Projects service from `features/projects/services`
- ❌ **DON'T**: Import anything from AIP feature
- ❌ **DON'T**: Share Projects mock data with other features

Field names may overlap (e.g., `status`, `year`), but values are independent.

## Architecture

```
features/projects/
├── mocks.ts              # All mock data (20 projects, details, updates)
├── services/             # Business logic layer
│   ├── project-repo-mock.ts  # Data access (joins mock tables)
│   └── project-service.ts    # High-level operations
├── types/                # TypeScript types
├── health/               # Health project components
├── infrastructure/       # Infrastructure project components
└── shared/               # Shared components
```

## Usage

### In Pages

```typescript
import { projectService } from "@/features/projects/services";

// List all health projects
const healthProjects = await projectService.getHealthProjects();

// Get specific project
const project = await projectService.getHealthProjectById("PROJ-H-2026-001");
```

### Service Methods

- `getHealthProjects(year?)` - List health projects
- `getInfrastructureProjects(year?)` - List infrastructure projects
- `getProjectById(id)` - Get any project by ID
- `getHealthProjectById(id)` - Get health project (type-safe)
- `getInfrastructureProjectById(id)` - Get infrastructure project (type-safe)
- `searchProjects(query, kind?)` - Search projects
- `getProjectStatistics()` - Get counts by status/kind

### Mock Data

All mocks in `mocks.ts`:
- `PROJECTS_MASTER` - 20 projects (8 health, 12 infrastructure)
- `HEALTH_DETAILS` - Health-specific information
- `INFRASTRUCTURE_DETAILS` - Infrastructure-specific information  
- `PROJECT_UPDATES` - Progress updates and milestones
- `FORM_OPTIONS` - Dropdown options for forms

### Edge Cases Included

- Long titles (PROJ-H-2026-004)
- 0% progress (PROJ-I-2026-004)
- 100% completion (PROJ-I-2025-001, PROJ-H-2025-001)
- Zero budget (PROJ-H-2026-004)
- High-value contract (PROJ-I-2026-004: ₱8.5M)

## Page Integration

All project pages use the service layer:

**Barangay Pages:**
- `app/(lgu)/barangay/(authenticated)/projects/health/page.tsx`
- `app/(lgu)/barangay/(authenticated)/projects/infrastructure/page.tsx`
- Detail and add-information pages

**City Pages:**
- `app/(lgu)/city/(authenticated)/projects/health/page.tsx`
- `app/(lgu)/city/(authenticated)/projects/infrastructure/page.tsx`
- Detail and add-information pages

## Data Flow

```
Page Component
    ↓
projectService (business logic)
    ↓
createMockProjectsRepo() (data access)
    ↓
mocks.ts (mock data)
```

## Adding New Projects

Edit `mocks.ts`:

1. Add to `PROJECTS_MASTER` with unique `projectRefCode`
2. Add details to `HEALTH_DETAILS` or `INFRASTRUCTURE_DETAILS`
3. Optionally add updates to `PROJECT_UPDATES`
4. Use naming: `PROJ-{H|I}-{YEAR}-{###}`

## Important Notes

- Mock data is deterministic (no random generators)
- Dates are ISO strings
- Money fields are numbers (formatting in UI)
- All types in `features/projects/types/`
- NO Supabase calls or external APIs
