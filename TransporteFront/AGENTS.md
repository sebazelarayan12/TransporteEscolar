# TransporteFront UI – AI Agent Ruleset

## Rol y Alcance
Eres el agente exclusivo del frontend (React 19 + Vite + Tailwind 4) del sistema Transporte Escolar. Recibirás tareas delegadas por el orquestador y debes:
1. Leer este archivo antes de cualquier cambio para comprender el contexto vigente.
2. Invocar los skills señalados en la tabla de Auto-invoke antes de tocar código.
3. Tras terminar una tarea, actualizar la sección **Context Snapshot** (subapartados “Recent Frontend Changes” y “Key UI Files”) con la información nueva.

## Skills Reference
- **brainstorming** – Diverge cuando se diseñan nuevas pantallas, UX o flujos.
- **systematic-debugging** – Metodología para diagnosticar errores de UI/estado/API.
- **frontend-design** / **interface-design** – Guías de diseño para dashboards, cards, tablas y mobile.
- **react-19** – Reglas del React Compiler, hooks, routing.
- **vercel-react-best-practices** – Optimización de rendimiento, splitting y datos.
- **tailwind-4** (+ **tailwind-v4-shadcn** cuando toque tokens) – Semántica de clases y variables.
- **typescript** – Tipado estricto y utilidades TS.
- **zod-4** – Validaciones de formularios junto con React Hook Form.
- **better-auth-best-practices** – Cuando se toquen interceptores o auth futura.
- **playwright** / **vitest** – Testing E2E y unitario.

## Auto-invoke Skills
| Acción | Skill |
| --- | --- |
| Idear nuevas pantallas o flujos de UX | brainstorming |
| Depurar fallos de UI, estado, API | systematic-debugging |
| Crear/modificar componentes, hooks o routing | react-19 |
| Optimizar performance, memoización natural | vercel-react-best-practices |
| Trabajar estilos, tokens, responsive | tailwind-4 (tailwind-v4-shadcn si se tocan tokens) |
| Diseñar layouts complejos / dashboards | frontend-design o interface-design |
| Actualizar tipos/contratos TS | typescript |
| Formularios/validaciones | typescript + zod-4 |
| Interceptores/auth | better-auth-best-practices |
| Tests unitarios | vitest |
| Tests E2E | playwright |

## Context Snapshot (marzo 2026) – mantener actualizado
### App Overview
- **Stack**: React 19 + Vite 7, Tailwind 4, TanStack Query 5, React Router 7, Axios.
- **Arquitectura**: Screaming. Cada dominio (`titulares`, `pasajeros`, `pagos`, `reinscripciones`, `gastos`) tiene `components/`, `pages/`, `services/`, `types/` y `helpers/`.
- **Layout**: `src/app/MainLayout` controla navegación lateral (desktop) y drawer (mobile). Todas las rutas se registran en `src/App.tsx` bajo `<MainLayout>`.

### Current Focus & Features
- **Gastos/Ingresos dashboard**: Tarjetas compactas y layout de dos columnas para gastos, sección de ingresos debajo; botón flotante “Nuevo gasto”.
- **Pagos**: Modal “Registrar Pago” con búsqueda paginada (debounce) y resumen financiero; utiliza `pagos/services/pagos.api.ts` y queries.
- **Reinscripciones**: Modal en la misma vista, marca teléfonos principales desde listado.
- **Forms monetarios**: `shared/ui/PriceInput` + `react-number-format` para montos (desde 7 mar 2026).
- **Release Notes banner**: lee metadata `ReleaseNotes__Descripcion` del backend para habilitar mensajes (“Pagina de gastos”).

### Recent Frontend Changes
- 15 mar 2026: Rediseño de módulo de gastos/ingresos (tarjetas, tabs, botón flotante, estados responsivos) + defaults del formulario de gasto en “Pagado”.
- 7 mar 2026: Precio unificado con `PriceInput` y `react-number-format` en todos los formularios monetarios.
- 3 mar 2026: Ajustes de pagos/reinscripciones + loader `.env` en backend que impacta `config/env.ts`.

### Key UI Files
- `src/gastos/components/GastoCard.tsx`, `GastoListSection.tsx`, `GastosContent.tsx` – tarjetas y layout actual.
- `src/gastos/components/IngresosExternosSection.tsx`, `IngresoCard.tsx` – resumen de ingresos externos.
- `src/gastos/components/GastosToolbar.tsx`, `GastosCategoriasCarousel.tsx` – filtros activos.
- `src/gastos/components/RegistrarGastoModal.tsx`, `GastoFormFields.tsx` – formulario default “Pagado”.
- `src/gastos/hooks/useGastosControlState.ts` – pestañas iniciales (gastos variables/ingresos fijos).
- `src/shared/ui/PriceInput.tsx` – input monetario obligatorio.
- `src/api/client.ts` – Axios + interceptores.
- `src/app/MainLayout.tsx`, `src/App.tsx` – routing principal.

### Update Protocol (obligatorio)
1. Después de cada entrega frontend, anota los cambios clave en “Recent Frontend Changes” con fecha y resumen.
2. Actualiza “Key UI Files” cuando agregues/elimines archivos relevantes.
3. Documenta nuevos patrones o dependencias en “Current Focus & Features” o “App Overview” si corresponde.
4. No cierres la tarea delegada hasta reflejar estas actualizaciones.

## Guardrails de Arquitectura
- Respetar Screaming Architecture; poner lógica de dominio dentro del directorio correspondiente. `shared/` sólo para piezas usadas por ≥2 dominios.
- Prohibido `useMemo`/`useCallback` salvo excepciones justificadas (React 19 Compiler).
- Datos remotos a través de TanStack Query. Invalida caches con los `keys` del dominio después de mutaciones.
- API calls exclusivamente desde `services/*.api.ts` usando `apiClient`.
- Tipos TypeScript deben reflejar 1:1 los DTOs del backend.
- Estilos: Tailwind 4 + palette institucional (#007a8a). No usar `var()` dentro de `className`.
- Formularios complejos → React Hook Form + Zod (esquemas en `schemas.ts` o `forms.ts`). Inputs numéricos con `z.coerce.number()`.
- Layouts deben ser responsive (mobile-first, clases `lg:` para desktop). Usa `shared/ui` para botones, cards, tablas.
- Ejecuta `npx -y react-doctor@latest . --verbose --diff` tras cada cambio frontend y corrige alertas antes de cerrar.

## Decision Guides
1. **¿Dónde ubicar un componente?**
   - Solo un dominio lo usa → `src/<dominio>/components`.
   - Se comparte entre dominios → `src/shared/ui` (o `shared/components`).
   - Es parte del layout global → `src/app`.
2. **Estado vs React Query**
   - Datos remotos → Query/Mutation hooks en `services/*.queries.ts`.
   - Estado UI local (modal abierta, tab activa) → componente o hook local.

## Commands & Tooling
```bash
npm install           # dependencias
npm run dev           # servidor Vite (http://localhost:5173)
npm run lint          # ESLint 9 + reglas personalizadas
npm run build         # bundle de producción
npm run preview       # servir build
npx -y react-doctor@latest . --verbose --diff  # obligatorio tras cambios
```

## QA Checklist
- [ ] `npm run lint` sin errores.
- [ ] `react-doctor` limpio.
- [ ] Estados loading/error/empty cubiertos en nuevas vistas.
- [ ] Tipos/queries actualizados acorde al backend.
- [ ] Diseño validado en mobile + desktop.
- [ ] Mutaciones invalidan las queries correctas.
- [ ] Variables de entorno documentadas (`VITE_API_BASE_URL`).

## Naming & Patterns
| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Páginas | `<Dominio><Nombre>Page` | `GastosControlPage` |
| Componentes | PascalCase | `RegistrarGastoModal` |
| Hooks | `use<Dominio><Acción>` | `useGastosControlState` |
| Query keys | `<dominio>Keys.scope` | `gastosKeys.resumen` |
| API services | `<dominio>Api.metodo` | `gastosApi.crearGasto` |
| Types | `<Dominio><Modelo>Response/Request` | `PagoMensualResponse` |
| Helpers | `<dominio>.helpers.ts` | `pagos/helpers/periodo.helpers.ts` |

## API & Data Contracts
- Base URL desde `config/env.ts` (`VITE_API_BASE_URL`, dev: http://localhost:5074/api).
- Requests y Responses deben usar los mismos campos que los DTOs del backend (camelCase).
- Paginación: `pageNumber`, `pageSize`, `search`, `mes`, `anio`.
- Manejar errores globales usando el interceptor (`api/client.ts`) y mostrar `ApiError` en UI.
- Después de cada mutación, llamar a `queryClient.invalidateQueries(<dominio>Keys.<scope>)`.

Mantén este documento como fuente de verdad del frontend. El orquestador exigirá que lo actualices tras cada cambio que afecte esta capa.
