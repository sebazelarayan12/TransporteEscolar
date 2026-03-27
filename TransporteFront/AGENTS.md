TransporteFront UI – AI Agent Ruleset
Regla global sin excepciones: nunca escribas tildes en ninguna palabra ni mensaje.

Skills Reference: For detailed patterns, use these skills
- brainstorming – Diverge before proposing new features, flows, or layout changes.
- systematic-debugging – Structured approach for diagnosing UI/API failures.
- frontend-design – High-polish UI decisions, look & feel aligned with the dashboard theme.
- interface-design – Patterns for boards, cards, and responsive layouts.
- react-19 – React Compiler rules, hooks, routing, render best practices.
- next-best-practices – Modern Vite/React conventions, data flows, performance tips.
- vercel-react-best-practices – Profiling, code splitting, caching optimizations.
- tailwind-4 – Tailwind v4 tokens, responsive patterns, custom palette usage.
- tailwind-v4-shadcn / tailwind-design-system – When adjusting theme tokens or system-wide styles.
- typescript – Strict typing, const assertions, utility types.
- zod-4 – Form validations with Zod v4 (paired with React Hook Form).
- better-auth-best-practices – Preparing axios interceptors/auth flows (future use).
- playwright – Playwright E2E testing patterns.
- vitest – Pruebas unitarias con Vitest (React/Vite).
Auto-invoke Skills
When performing these actions, ALWAYS invoke the corresponding skill FIRST:
Action | Skill
--- | ---
Brainstorm new features, flows, or layouts | brainstorming
Debug UI/runtime/API issues | systematic-debugging
Create/modify React components, hooks, routing | react-19
Optimize performance, reduce rerenders, caching | vercel-react-best-practices
Work on Tailwind styles, tokens, responsive layouts | tailwind-4 (tailwind-v4-shadcn if editing theme)
Design complex UI, dashboards, layouts | frontend-design or interface-design
Write/adjust TypeScript types/interfaces | typescript
Add new schema validation/forms | typescript + zod-4
Configure auth/interceptors in apiClient | better-auth-best-practices
Write or update unit tests | vitest
Author Playwright E2E tests | playwright
CRITICAL RULES – NON-NEGOTIABLE
React & State
- ALWAYS use function components and native hooks; keep StrictMode.
- NEVER use useMemo/useCallback without proof; rely on React Compiler optimizations.
- ALWAYS fetch server data via TanStack Query; NEVER store API caches in useState.
- ALWAYS handle loading/error/empty states for lists and detail pages.
Architecture & Files
- ALWAYS follow Screaming Architecture: app/, shared/, api/, config/, plus domain folders (titulares, pasajeros, pagos, reinscripciones).
- Reuse code via shared/ only when ≥2 domains need it; otherwise keep logic local.
- NEVER add domain logic into shared/ unless it is generic.
- ALWAYS respect the existing folder split (pages, components, services, types, helpers).
TanStack Query
- ALWAYS define query keys per domain (titularesKeys, etc.).
- ALWAYS invalidate relevant caches after mutations (queryClient.invalidateQueries).
- NEVER mutate React Query cache manually if an invalidate covers the scenario.
API Client & Contracts
- ALWAYS call backend via apiClient; it configures base URL, interceptors, and error handling.
- ALWAYS update domain DTO types (TitularResponse, etc.) when backend changes.
- NEVER hardcode absolute URLs; rely on config.apiBaseUrl.
Styling & UI
- ALWAYS use Tailwind classes and the project palette (#007a8a).
- ALWAYS reuse shared UI components (Button, Card, SearchInput, Pagination, etc.).
- NEVER inline hex colors if a token/class exists; prefer CSS variables/Tailwind tokens.
- ALWAYS ensure every page is responsive (desktop via lg:*, mobile-first defaults).
Routing & Layout
- ALWAYS register new routes inside App.tsx under <MainLayout>.
- NEVER duplicate layout logic; extend MainLayout components where needed.
- ALWAYS ensure navigation items update when adding new routes in MainLayout.
Forms & Validation
- For non-trivial forms, ALWAYS pair React Hook Form with Zod (zod-4 skill).
- NEVER rely solely on UI validation; mirror backend constraints when forms are added.
Decision Trees
Component placement
- Used in only one feature? → place under src/<domain>/components.
- Used by multiple domains? → move to src/shared/ui.
- Layout-wide element? → src/app.
Creating new stateful logic
- Needs data fetch/caching? → create TanStack query/mutation in services/*.queries.ts.
- Pure UI helper reused multiple times? → shared/hooks.
- One-off hook for a page? → keep next to that page/component.
Adding a new page
1. Create file in src/<domain>/pages.
2. Hook data via services/*.queries.ts.
3. Compose UI from shared/ui + domain components.
4. Register route in App.tsx and update navigation in MainLayout if needed.
TECH STACK
React 19 | Vite 7 | TypeScript 5.9 | TailwindCSS 4 | TanStack Query 5 | React Router 6 | Axios | React Hook Form | Zod 4 | Material Symbols | ESLint 9
PROJECT STRUCTURE (TransporteFront/src)
- app/ – Main layout (MainLayout), dashboard, not-found page, layout-level components.
- api/ – client.ts (Axios instance, interceptors, central error handling).
- config/ – env.ts (reads VITE_API_BASE_URL).
- shared/
  - ui/ – Buttons, Cards, SearchInput, Pagination, Drawer, MonthYearFilter, etc.
  - hooks/ – useDebounce and other reusable hooks.
  - types/ – global types (e.g., PaginatedResponse, ApiError).
  - utils/ – shared helpers (add here when multiple domains need them).
- Domain folders (titulares, pasajeros, pagos, reinscripciones)
  - pages/ – screens.
  - components/ – domain-specific UI.
  - services/ – *.api.ts (REST calls) and *.queries.ts (TanStack Query hooks).
  - types/ – DTOs per domain.
  - helpers/ – formatting or domain utilities.
- Other root files: App.tsx, main.tsx, index.css, assets.
COMMANDS
npm install          # install dependencies
npm run dev          # start Vite dev server (http://localhost:5173)
npm run build        # compile production bundle
npm run preview      # serve production build locally
npm run lint         # run ESLint (should pass cleanly before commits)
QA CHECKLIST
- npm run lint passes.
- Loading/error/empty UI states implemented for every list/detail.
- React Query caches invalidated after mutations; stale data never persists.
- DTO types and endpoint definitions updated to match backend controllers.
- Layout tested on desktop and mobile (sidebar, drawer, cards).
- VITE_API_BASE_URL configured via .env; no secrets committed.
- Manual smoke test of key flows (navigation, search/filter, pagination).
- Any new form validated both client-side (Zod) and consistent with backend rules.
NAMING CONVENTIONS
Entity | Pattern | Example
--- | --- | ---
Pages | <Domain><PageName>Page | TitularesListPage
Hooks | use<Domain><Action> | useTitularesPaginados
Query keys | <domain>Keys.<scope> | titularesKeys.paginados
API services | <domain>Api.method in services/<domain>.api.ts | titularesApi.getPaginados
React components | PascalCase inside components/ | TitularTableRow
Types | <Domain><Model> or <Domain><Model>Request/Response | TitularResponse, PagoMensualModel
Helpers | <domain>.helpers.ts | pagos/helpers/periodo.helpers.ts
API CONVENTIONS
- Base URL from config.apiBaseUrl (default http://localhost:5074/api).
- Endpoints mirror backend routes: /titulares, /pasajeros, /pagos, /reinscripciones.
- Pagination/filter params: search, pageNumber, pageSize, mes, anio, etc. (camelCase).
- Responses follow backend DTOs (e.g., TitularModel.Response mapping to TitularResponse).
- Soft delete indicates status via fechaBaja + activo.
- Error payloads: { type, message, errors }; surface them through Alert/ErrorState.
- Dates from backend are ISO YYYY-MM-DD (DateOnly converters); format on display as needed.
Remember: the root orchestrator AGENTS.md is the primary authority—follow its global rules, then use this document for all frontend-specific guidance
