# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Platform for managing school transportation: account holders (titulares/families), passengers (students), annual re-enrollments, monthly payments, and internal alerts. Backend .NET 8 exposes REST APIs; frontend React 19 consumes everything via TanStack Query.

## Commands

### Backend (from `TransporteEscolar/TransporteEscolar.Api/`)
```bash
dotnet run --launch-profile Testing       # Run with test DB seeder
dotnet run --launch-profile Development   # Run in development mode
dotnet build                              # Build only
```

### Migrations (from `TransporteEscolar/TransporteEscolar.Infrastructure/`)
```bash
dotnet ef migrations add <Name> --startup-project ../TransporteEscolar.Api
dotnet ef database update --startup-project ../TransporteEscolar.Api
```

### Frontend (from `TransporteFront/`)
```bash
npm run dev      # Vite dev server on port 5174
npm run build    # tsc -b && vite build
npm run lint     # ESLint

# Required after every UI change:
npx -y react-doctor@latest . --verbose --diff
```

### Database
```bash
docker-compose -f docker-compose.testing.yml up -d   # Testing DB
docker-compose up -d                                   # Production DB
```

## Architecture

### Backend — Clean Architecture + CQRS

```
TransporteEscolar.Api/           ← Controllers, Middleware, DI registration
TransporteEscolar.Application/   ← CQRS Handlers, Services, DTOs, Validators, Interfaces
TransporteEscolar.Domain/        ← Entities (with business logic methods), Enums, Exceptions
TransporteEscolar.Infrastructure/ ← EF Core, Repositories, External services (WhatsApp, WebPush)
```

- Controllers call MediatR `ISender` for command/query dispatch.
- Command/Query handlers in `Application/PagosMensuales/` and `Application/Pasajeros/` follow CQRS; services (`Application/Services/`) handle the rest.
- Domain entities contain business logic methods: `EstaPagado()`, `EstaVencido()`, `SaldoPendiente()`, `AplicarPago()`.
- All services registered via `ServiceCollectionExtensions.cs`; new services must be registered there.
- `GlobalExceptionHandlerMiddleware` maps domain exceptions to HTTP codes: `NotFoundException→404`, `ValidationException→400`, `BusinessRuleException→400`.
- Auto-migrations run on startup via `context.Database.Migrate()` — never run migrations manually in prod.
- Config loaded from `.env` via `DotEnvLoader`; see `.env.example` for required variables.

### Frontend — Feature-Based (Screaming Architecture)

```
src/
  api/          ← Axios client with interceptors and error normalization
  app/          ← Dashboard, MainLayout, routing entry
  config/       ← env.ts (VITE_API_BASE_URL)
  shared/       ← Reusable UI components, hooks, types, utils
  titulares/    ← Account holders module
  pasajeros/    ← Students module
  pagos/        ← Monthly payments module
  reinscripciones/ ← Re-enrollment module
  horarios/     ← Schedules module
  gastos/       ← Expenses module
  notificaciones/  ← Push notification service
```

Each feature module contains: `pages/`, `components/`, `hooks/`, `services/` (API layer), `queries/` (TanStack Query), `schemas/` (Zod), and `types/`.

### API Integration Pattern

```typescript
// 1. Service layer (e.g., pagos.api.ts)
export const pagosApi = { getList: (params) => apiClient.get<Response>(url, params) };

// 2. Query layer (e.g., pagos.queries.ts)
export const usePagosList = (opts) => useQuery({ queryKey: pagosKeys.list(opts), queryFn: () => pagosApi.getList(opts) });

// 3. Component consumes hook directly
const { data, isLoading } = usePagosList(filters);
```

Call `invalidateQueries` with the domain key after mutations.

## Critical Conventions

### Frontend
- **No `useMemo`/`useCallback`** unless there is a demonstrated performance need.
- **Never use `var()` CSS variables inside `className`** — use Tailwind utilities only.
- **Run `react-doctor`** (`npx -y react-doctor@latest . --verbose --diff`) after every UI change.
- **Outside `src/titulares/`**, always display account holders using `getTitularApellidoDisplay` (surname only).
- **Numeric values** (non-percentage) must use shared helpers from `shared/utils/number.helpers.ts` and `currency.helpers.ts` — truncate toward zero. Percentages keep their own format.
- **Form inputs** use React Hook Form + Zod (`zodResolver`). Numeric inputs use `z.coerce.number()`.
- ALWAYS fetch server data via TanStack Query; NEVER store API caches in `useState`.
- ALWAYS handle loading/error/empty states for every list and detail page.
- ALWAYS register new routes inside `App.tsx` under `<MainLayout>` and update navigation items.
- ALWAYS call backend via `apiClient`; NEVER hardcode absolute URLs.
- Reuse code via `shared/` only when 2+ domains need it; otherwise keep logic local.

### Backend
- New services must be wired in `ServiceCollectionExtensions.cs`.
- Push notifications use `WebPushService` with VAPID config; message formatting uses `FormatearMensajeConPeriodoActual` helper.
- Migrations target `TransporteEscolar.Infrastructure` with `TransporteEscolar.Api` as startup project.
- **NEVER reintroduce `IPagoMensualService` or `IPasajeroService`** — both modules use CQRS/MediatR. New business rules go in Domain entities or new handlers.
- **NEVER return EF entities from controllers** — always map to DTOs using the `MapearAResponse` / `*MappingExtensions` pattern.
- **NEVER access `DbContext` from controllers** — only from repositories.
- Domain entities use **private setters and managed constructors**; EF navigation must not be modified outside the aggregate/services.
- ALWAYS throw `ValidationException` from validators; ALWAYS throw `NotFoundException` for missing resources.
- Seeder (`TestDataSeeder`) runs **only in Testing profile**, never in Production.
- CORS: NEVER combine `AllowCredentials` with `AllowAnyOrigin` in production.

## Backend Naming Conventions

| Element | Pattern | Example |
|---|---|---|
| DTO | `<Entity>Model.Request` / `<Entity>Model.Response` | `PagoMensualModel.Response` |
| Service interface/class | `I<Entity>Service` / `<Entity>Service` | `IReinscripcionService` |
| Repository | `I<Entity>Repository` / `<Entity>Repository` | `IPagoMensualRepository` |
| Controller | `<Entities>Controller` | `PagosMensualesController` |
| Validator | `<Entity>Validator` | `PagoMensualValidator` |
| Mapping extensions | `<Entity>MappingExtensions` | `PagoMensualMappingExtensions` |
| CQRS Command | `<Action><Entity>Command` | `RegistrarPagoCommand` |
| CQRS Query | `Get<Entity>Query` | `GetPagosMensualesQuery` |

## Frontend Naming Conventions

| Element | Pattern | Example |
|---|---|---|
| Page | `<Domain><Name>Page` | `PagosListPage` |
| Hook | `use<Domain><Action>` | `usePagosList` |
| Query keys | `<domain>Keys.<scope>` | `pagosKeys.list` |
| API service | `<domain>Api.method` in `services/<domain>.api.ts` | `pagosApi.getList` |
| Component | PascalCase in `components/` | `PaymentCard` |
| Types | `<Domain>Response` or `<Domain>Model` | `PagoMensualModel` |
| Helpers | `<domain>.helpers.ts` | `number.helpers.ts` |

## Frontend Decision Trees

**Where to place a component:**
- Used in only one domain → `src/<domain>/components/`
- Used by 2+ domains → `src/shared/ui/`
- Layout-wide → `src/app/`

**Where to place new stateful logic:**
- Needs data fetch/caching → `services/*.queries.ts` (TanStack Query)
- Pure UI helper reused by 2+ components → `shared/hooks/`
- One-off for a single page → next to that page/component

**Adding a new page:**
1. Create file in `src/<domain>/pages/`
2. Wire data via `services/*.queries.ts`
3. Compose UI from `shared/ui/` + domain components
4. Register route in `App.tsx` + update `MainLayout` navigation if needed

## QA Checklist

### Before committing backend changes
- [ ] Migrations created and applied (`dotnet ef database update`)
- [ ] Seeder limited to Testing profile
- [ ] `dotnet run --launch-profile Testing` boots without errors
- [ ] Swagger accessible at `http://localhost:5074/swagger`
- [ ] DTOs updated and controllers return correct types
- [ ] No sensitive data in config or commits

### Before committing frontend changes
- [ ] `npm run lint` passes cleanly
- [ ] `react-doctor` passes (`npx -y react-doctor@latest . --verbose --diff`)
- [ ] Loading/error/empty states implemented for every list/detail
- [ ] TanStack Query caches invalidated after mutations
- [ ] DTO types updated to match backend changes
- [ ] Layout tested on desktop and mobile
- [ ] `VITE_API_BASE_URL` via `.env`; no secrets committed

## Session Commands

**"guarda todo"** → update `recarga.md` in project root with: current date, what changed, files modified, key decisions, pending next steps. This file is gitignored and used to restore context in future sessions.

<!-- autoskills:start -->

Summary generated by `autoskills`. Check the full files inside `.claude/skills`.

## Accessibility (a11y)

Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".

- `.claude/skills/accessibility/SKILL.md`
- `.claude/skills/accessibility/references/A11Y-PATTERNS.md`: Practical, copy-paste-ready patterns for common accessibility requirements. Each pattern is self-contained and linked from the main [SKILL.md](../SKILL.md).
- `.claude/skills/accessibility/references/WCAG.md`

## Breaking Changes from AI SDK 4

>

- `.claude/skills/ai-sdk-5/SKILL.md`

## Critical Patterns

>

- `.claude/skills/django-drf/SKILL.md`
- `.claude/skills/django-drf/references/file-locations.md`: Located in `api/src/backend/config/settings.py`:
- `.claude/skills/django-drf/references/json-api-conventions.md`

## Use With django-drf

>

- `.claude/skills/jsonapi/SKILL.md`

## App Router File Conventions

>

- `.claude/skills/nextjs-15/SKILL.md`

## MCP Workflow (MANDATORY If Available)

>

- `.claude/skills/playwright/SKILL.md`
- `.claude/skills/playwright/references/prowler-e2e.md`: For Prowler-specific Playwright patterns, see:

## When to Use

>

- `.claude/skills/prowler-api/SKILL.md`
- `.claude/skills/prowler-api/references/configuration.md`: **To enable throttling:**
- `.claude/skills/prowler-api/references/file-locations.md`
- `.claude/skills/prowler-api/references/modeling-decisions.md`: **Why uuid7 for time-series?** UUIDv7 includes timestamp, enabling efficient range queries and partitioning.
- `.claude/skills/prowler-api/references/production-settings.md`: This command checks for common deployment issues and missing security settings.

## Overview

>

- `.claude/skills/prowler-attack-paths-query/SKILL.md`

## Changelog Locations

>

- `.claude/skills/prowler-changelog/SKILL.md`
- `.claude/skills/prowler-changelog/assets/entry-templates.md`: **CRITICAL:** Always add new entries at the **BOTTOM** of each section (before the next section header or `---`).

## What this skill covers

>

- `.claude/skills/prowler-ci/SKILL.md`

## Critical Rules

>

- `.claude/skills/prowler-commit/SKILL.md`

## When to Use

>

- `.claude/skills/prowler-compliance-review/SKILL.md`
- `.claude/skills/prowler-compliance-review/references/review-checklist.md`: Run the validation script from the project root:

## When to Use

>

- `.claude/skills/prowler-compliance/SKILL.md`
- `.claude/skills/prowler-compliance/references/compliance-docs.md`: Key files for understanding and modifying compliance frameworks:

## When to Use

>

- `.claude/skills/prowler-docs/SKILL.md`
- `.claude/skills/prowler-docs/references/documentation-docs.md`: For documentation writing standards, see:

## Overview

>

- `.claude/skills/prowler-mcp/SKILL.md`

## PR Creation Process

>

- `.claude/skills/prowler-pr/SKILL.md`
- `.claude/skills/prowler-pr/references/pr-docs.md`: For PR conventions and workflow, see:

## When to Use

>

- `.claude/skills/prowler-provider/SKILL.md`
- `.claude/skills/prowler-provider/references/provider-docs.md`: For detailed provider development patterns, see:

## Check Structure

>

- `.claude/skills/prowler-sdk-check/SKILL.md`
- `.claude/skills/prowler-sdk-check/references/metadata-docs.md`: For detailed check development patterns, see:

## Critical Rules

>

- `.claude/skills/prowler-test-api/SKILL.md`
- `.claude/skills/prowler-test-api/references/test-api-docs.md`: Main ViewSet tests covering: - `TestUserViewSet` - User CRUD, password validation, deletion cascades - `TestTenantViewSet` - Tenant operations - `TestProviderViewSet` - Provider CRUD, async deletion, connection testing - `TestScanViewSet` - Scan trigger, list, filter - `TestFindingViewSet` - Find...

## CRITICAL: Provider-Specific Testing

>

- `.claude/skills/prowler-test-sdk/SKILL.md`
- `.claude/skills/prowler-test-sdk/references/testing-docs.md`: For detailed SDK testing patterns, see:

## Prowler UI Test Structure

>

- `.claude/skills/prowler-test-ui/SKILL.md`
- `.claude/skills/prowler-test-ui/references/e2e-docs.md`: For Playwright E2E testing patterns, see:

## Related Generic Skills

>

- `.claude/skills/prowler-ui/SKILL.md`
- `.claude/skills/prowler-ui/references/ui-docs.md`: For UI-related patterns, see:

## Components

>

- `.claude/skills/prowler/SKILL.md`
- `.claude/skills/prowler/references/prowler-docs.md`: For project overview and development setup, see:

## Basic Test Structure

>

- `.claude/skills/pytest/SKILL.md`
- `.claude/skills/pytest/references/prowler-testing.md`: For Prowler-specific pytest patterns, see:

## No Manual Memoization (REQUIRED)

>

- `.claude/skills/react-19/SKILL.md`

## AI Agent Skills

- `.claude/skills/README.md`: This directory contains **Agent Skills** following the [Agent Skills open standard](https://agentskills.io). Skills provide domain-specific patterns, conventions, and guardrails that help AI coding assistants (Claude Code, OpenCode, Cursor, etc.) understand project-specific requirements.

## SEO optimization

Optimize for search engine visibility and ranking. Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization".

- `.claude/skills/seo/SKILL.md`

## When to Create a Skill

>

- `.claude/skills/skill-creator/SKILL.md`
- `.claude/skills/skill-creator/assets/SKILL-TEMPLATE.md`: >

## Purpose

>

- `.claude/skills/skill-sync/SKILL.md`

## Styling Decision Tree

>

- `.claude/skills/tailwind-4/SKILL.md`

## Const Types Pattern (REQUIRED)

>

- `.claude/skills/typescript/SKILL.md`

## Breaking Changes from Zod 3

>

- `.claude/skills/zod-4/SKILL.md`

## Basic Store

>

- `.claude/skills/zustand-5/SKILL.md`

<!-- autoskills:end -->
