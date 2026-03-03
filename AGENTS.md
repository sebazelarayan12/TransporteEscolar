# ⚠️ INSTRUCCIÓN PRIORITARIA: Recarga de Contexto

**ANTES DE CUALQUIER TAREA**: Si esta es tu primera interacción en la sesión, **LEE INMEDIATAMENTE** el archivo `recarga.md` (si existe) para cargar el contexto de la sesión anterior.

```bash
# Ejecuta esto primero si es inicio de sesión
cat recarga.md
```

## Comando "guarda todo"

Cuando el usuario diga **"guarda todo"**, crea o sobrescribe el archivo `recarga.md` en la raíz del proyecto con el siguiente contenido:

### Estructura del archivo recarga.md:

```markdown
# Contexto de Sesión - Transporte Escolar

**Última actualización**: [fecha y hora actual]

---

## 🎯 Idea General del Proyecto

[Describe brevemente el propósito del sistema: gestión de transporte escolar, entidades principales (titulares, pasajeros, pagos, reinscripciones), objetivo del negocio]

---

## 🛠️ Stack Tecnológico

### Backend
- .NET 8, ASP.NET Core Web API
- Entity Framework Core 8
- SQL Server (Docker)
- Puerto: 5074
- Perfil: Testing (con seeder)

### Frontend
- React 19 + Vite 7
- TypeScript 5.9
- TailwindCSS 4
- TanStack Query 5
- React Router 7
- Axios
- Puerto: 5173

### Arquitectura
- Backend: Domain, Application, Infrastructure, Api (Clean Architecture)
- Frontend: Screaming Architecture (dominios: titulares, pasajeros, pagos, reinscripciones)

---

## 📋 Últimos Cambios

### [Fecha] - [Título del cambio]

**Archivos modificados/creados:**
- `ruta/archivo1.tsx`
- `ruta/archivo2.cs`

**Qué se hizo:**
- Detalle 1
- Detalle 2

**Decisiones importantes:**
- Por qué se eligió X solución sobre Y
- Patrones específicos implementados

**Estado actual:**
- ✅ Funcionalidad completa
- ⚠️ Pendiente: [algo por hacer]

---

### [Fecha anterior] - [Cambio anterior]

[Repetir estructura anterior para los últimos 3-5 cambios significativos]

---

## 🔑 Patrones y Convenciones Críticos

### Frontend
- NUNCA usar `useMemo`/`useCallback` (React 19 Compiler)
- NUNCA usar `var()` en className (usar Tailwind semantic)
- Usar `z.coerce.number()` para inputs numéricos
- Query keys por dominio (titularesKeys, pasajerosKeys, etc.)

### Backend
- Servicios registrados en `ServiceCollectionExtensions.cs`
- Migraciones desde `TransporteEscolar.Infrastructure`
- GlobalExceptionHandler para errores consistentes

---

## 📂 Archivos Clave Recientes

[Lista de los 10-15 archivos más importantes trabajados recientemente]

- `src/pasajeros/components/PasajeroForm.tsx` - Formulario completo de pasajeros
- `src/pasajeros/components/TitularCombobox.tsx` - Combobox personalizado con búsqueda
- [etc.]

---

## 🚀 Próximos Pasos Sugeridos

- [ ] Implementar edición de pasajeros
- [ ] Crear módulo de pagos
- [ ] Agregar tests E2E con Playwright
- [etc.]

---

## ⚡ Comandos Rápidos

```bash
# Levantar base de datos
docker-compose -f docker-compose.testing.yml up -d

# Backend (desde TransporteEscolar/TransporteEscolar.Api)
dotnet run --launch-profile Testing

# Frontend (desde TransporteFront)
npm run dev

# Migraciones (desde TransporteEscolar/TransporteEscolar.Infrastructure)
dotnet ef migrations add NombreMigracion --startup-project ../TransporteEscolar.Api
dotnet ef database update --startup-project ../TransporteEscolar.Api
```

---
```

**Notas importantes:**
- Este archivo está en `.gitignore` (no se sube a git)
- Actualízalo cada vez que el usuario diga "guarda todo"
- Incluye contexto suficiente para que la siguiente sesión arranque sin preguntas
- Prioriza: tecnologías, últimos cambios, decisiones de diseño, patrones usados

---

# ⚠️ INSTRUCCIÓN PRIORITARIA: Recarga de Contexto

**ANTES DE CUALQUIER TAREA**: Si esta es tu primera interacción en la sesión, **LEE INMEDIATAMENTE** el archivo `recarga.md` (si existe) para cargar el contexto de la sesión anterior.

```bash
# Ejecuta esto primero si es inicio de sesión
cat recarga.md
```

## Comando "guarda todo"

Cuando el usuario diga **"guarda todo"**, crea o sobrescribe el archivo `recarga.md` en la raíz del proyecto con el siguiente contenido:

### Estructura del archivo recarga.md:

```markdown
# Contexto de Sesión - Transporte Escolar

**Última actualización**: [fecha y hora actual]

---

## 🎯 Idea General del Proyecto

[Describe brevemente el propósito del sistema: gestión de transporte escolar, entidades principales (titulares, pasajeros, pagos, reinscripciones), objetivo del negocio]

---

## 🛠️ Stack Tecnológico

### Backend
- .NET 8, ASP.NET Core Web API
- Entity Framework Core 8
- SQL Server (Docker)
- Puerto: 5074
- Perfil: Testing (con seeder)

### Frontend
- React 19 + Vite 7
- TypeScript 5.9
- TailwindCSS 4
- TanStack Query 5
- React Router 7
- Axios
- Puerto: 5173

### Arquitectura
- Backend: Domain, Application, Infrastructure, Api (Clean Architecture)
- Frontend: Screaming Architecture (dominios: titulares, pasajeros, pagos, reinscripciones)

---

## 📋 Últimos Cambios

### [Fecha] - [Título del cambio]

**Archivos modificados/creados:**
- `ruta/archivo1.tsx`
- `ruta/archivo2.cs`

**Qué se hizo:**
- Detalle 1
- Detalle 2

**Decisiones importantes:**
- Por qué se eligió X solución sobre Y
- Patrones específicos implementados

**Estado actual:**
- ✅ Funcionalidad completa
- ⚠️ Pendiente: [algo por hacer]

---

### [Fecha anterior] - [Cambio anterior]

[Repetir estructura anterior para los últimos 3-5 cambios significativos]

---

## 🔑 Patrones y Convenciones Críticos

### Frontend
- NUNCA usar `useMemo`/`useCallback` (React 19 Compiler)
- NUNCA usar `var()` en className (usar Tailwind semantic)
- Usar `z.coerce.number()` para inputs numéricos
- Query keys por dominio (titularesKeys, pasajerosKeys, etc.)

### Backend
- Servicios registrados en `ServiceCollectionExtensions.cs`
- Migraciones desde `TransporteEscolar.Infrastructure`
- GlobalExceptionHandler para errores consistentes

---

## 📂 Archivos Clave Recientes

[Lista de los 10-15 archivos más importantes trabajados recientemente]

- `src/pasajeros/components/PasajeroForm.tsx` - Formulario completo de pasajeros
- `src/pasajeros/components/TitularCombobox.tsx` - Combobox personalizado con búsqueda
- [etc.]

---

## 🚀 Próximos Pasos Sugeridos

- [ ] Implementar edición de pasajeros
- [ ] Crear módulo de pagos
- [ ] Agregar tests E2E con Playwright
- [etc.]

---

## ⚡ Comandos Rápidos

```bash
# Levantar base de datos
docker-compose -f docker-compose.testing.yml up -d

# Backend (desde TransporteEscolar/TransporteEscolar.Api)
dotnet run --launch-profile Testing

# Frontend (desde TransporteFront)
npm run dev

# Migraciones (desde TransporteEscolar/TransporteEscolar.Infrastructure)
dotnet ef migrations add NombreMigracion --startup-project ../TransporteEscolar.Api
dotnet ef database update --startup-project ../TransporteEscolar.Api
```

---
```

**Notas importantes:**
- Este archivo está en `.gitignore` (no se sube a git)
- Actualízalo cada vez que el usuario diga "guarda todo"
- Incluye contexto suficiente para que la siguiente sesión arranque sin preguntas
- Prioriza: tecnologías, últimos cambios, decisiones de diseño, patrones usados

---

## 🆕 Contexto reciente (10 feb 2026)

- Reinscripciones: el detalle de titular ahora permite marcar teléfonos principales desde el listado y la modal de “Nueva Reinscripción” vive en la misma página, usando los endpoints existentes y refrescando TanStack Query.
- Pagos: el botón superior abre un modal "Registrar Pago" con búsqueda paginada (debounce) de titulares que ya tienen cuotas generadas; el modal muestra resumen financiero y registra movimientos usando `useRegistrarPago`.
- Backend: se agregó `GET /pagosmensuales/titulares-con-pagos` para obtener titulares con cuotas generadas; `PagoMensualService` + repos implementan paginación y filtros, reutilizando el mapper de Titulares.
- UI: el modal de pagos ahora soporta anchura `2xl`, estados mejorados en mobile/desktop y contraste ajustado para los titulares seleccionados.
- Pendientes inmediatos: limpiar deudas de meses futuros, enriquecer la lista de pagos con estados (confirmado/pendiente), ajustar el botón primario del modal y revisar el dashboard.

Para más detalle, también revisa el archivo `recarga.md`.

# Repository Guidelines
- Este archivo gobierna todo el monorepo Transporte. Cada componente puede tener su propio AGENTS.md; si existe, prevalece sobre este documento.  
  - Para tareas del backend ve a TransporteEscolar/AGENTS.md.  
  - Para tareas del frontend ve a TransporteFront/AGENTS.md.
- Mantén credenciales y datos sensibles fuera del repositorio. Revisa .gitignore (.env*, .sql, DESARROLLO-RED-LOCAL.md, recarga.md) y respétalo siempre.
- Trabaja con los perfiles y puertos establecidos: backend 5074, frontend 5173, SQL Server en Docker 1433/1434. Usa el perfil Testing y el seeder solo en entornos de prueba.
- Sigue un flujo Git limpio y describe los cambios con claridad (convencional commits recomendado). No modifiques o reviertas trabajo ajeno.
- Después de cada `git push`, el orquestador debe preguntarle al usuario si desea registrar una nueva notificación de actualización y solo hacerlo si el usuario lo confirma y entrega la descripción exacta que quiere mostrar.
- Antes de desplegar, endurece CORS, elimina IPs locales y usa HTTPS/env vars seguras (ver Program.cs y DESARROLLO-RED-LOCAL.md).
- Recomendado: docker-compose -f docker-compose.testing.yml up -d → dotnet run --launch-profile Testing → npm run dev.
- Cuando modifiques o agregues código en el frontend, siempre debes ejecutar `npx -y react-doctor@latest . --verbose --diff` al final, corregir cualquier error o warning que aparezca y volver a correrlo hasta que esté limpio.
How to Use This Guide
1. Determina si el trabajo es backend o frontend. Luego:
   - Backend → usa TransporteEscolar/AGENTS.md.
   - Frontend → usa TransporteFront/AGENTS.md.
   - Este orquestador solo resume las normas globales; cada componente tiene instrucciones más específicas.
2. Invoca los skills apropiados antes de ejecutar cualquier tarea (ver tablas siguientes).
3. Mantén sincronizados los contratos API↔front: cada cambio en controllers exige actualizar services/*.api.ts y *.queries.ts.
Available Skills
Generic Skills (cualquier componente)
| Skill | Descripción | Ubicación |
| --- | --- | --- |
| brainstorming | Diverge antes de tareas creativas | .agents/skills/brainstorming/SKILL.md |
| systematic-debugging | Diagnóstico de bugs y fallas | .agents/skills/systematic-debugging/SKILL.md |
| csharp-developer | Patrones .NET 8, ASP.NET Core, EF Core | .agents/skills/csharp-developer/SKILL.md |
| api-design-principles | Buenas prácticas REST/HTTP | .agents/skills/api-design-principles/SKILL.md |
| error-handling-patterns | Manejo robusto de errores | .agents/skills/error-handling-patterns/SKILL.md |
| react-19 | Reglas de React Compiler, hooks, routing | .claude/skills/react-19/SKILL.md |
| next-best-practices | Guía de mejores prácticas Next/Vite | .agents/skills/next-best-practices/SKILL.md |
| tailwind-4 | Patrones Tailwind v4 | .claude/skills/tailwind-4/SKILL.md |
| typescript | Tipado estricto y utilidades TS | .claude/skills/typescript/SKILL.md |
| zod-4 | Validaciones Zod v4 | .claude/skills/zod-4/SKILL.md |
| playwright | Testing end-to-end | .claude/skills/playwright/SKILL.md |
| vitest | Pruebas unitarias con Vitest (React/Vite) | .agents/skills/vitest/SKILL.md |
Skills específicas de Transporte
| Skill | Cuándo usarla | Ubicación |
| --- | --- | --- |
| frontend-design | Diseños UI refinados | .agents/skills/frontend-design/SKILL.md |
| interface-design | Dashboards/paneles internos | .agents/skills/interface-design/SKILL.md |
| vercel-react-best-practices | Rendimiento React/Vite | .agents/skills/vercel-react-best-practices/SKILL.md |
| tailwind-v4-shadcn / tailwind-design-system | Tokens/temas Tailwind | .agents/skills/... |
| better-auth-best-practices | Preparar auth/interceptors | .agents/skills/better-auth-best-practices/SKILL.md |
Auto-invoke Skills
| Acción | Skill obligatorio |
| --- | --- |
| Idear nuevas features o UI | brainstorming |
| Depurar errores | systematic-debugging |
| Controllers/Services/Repos EF Core | csharp-developer |
| Definir contratos REST | api-design-principles |
| Middleware/manejo de errores | error-handling-patterns |
| Componentes React, hooks, TanStack Query | react-19 |
| Optimización/patrones avanzados React/Vite | vercel-react-best-practices |
| Estilos Tailwind/layout responsive | tailwind-4 |
| UI compleja/dashboards | frontend-design o interface-design |
| Tipos TS / Zod schemas | typescript, zod-4 |
| Formularios/validaciones front | typescript + zod-4 |
| Auth/interceptors | better-auth-best-practices |
| Pruebas unitarias con Vitest | vitest |
| Testing E2E | playwright |
Project Overview
| Componente | Ubicación | Stack |
| --- | --- | --- |
| TransporteEscolar (Backend) | ./TransporteEscolar | .NET 8, ASP.NET Core Web API, EF Core, SQL Server |
| TransporteFront (Frontend) | ./TransporteFront | React 19 + Vite, TypeScript, Tailwind 4, TanStack Query |
| Infraestructura | Raíz | Docker Compose (SQL Server), herramientas de red local |
Backend – TransporteEscolar  
(Usa TransporteEscolar/AGENTS.md para instrucciones detalladas)
- Capas: Domain, Application, Infrastructure, Api. Servicios y repos se registran en Api/DependencyInjection/ServiceCollectionExtensions.cs.
- Setup rápido:
  - dotnet restore && dotnet build TransporteEscolar.sln
  - Migraciones:
 cd TransporteEscolar/TransporteEscolar.Infrastructure && dotnet ef migrations add ...
  - Ejecución: cd TransporteEscolar/TransporteEscolar.Api && dotnet run --launch-profile Testing
  - DB: docker-compose -f docker-compose.testing.yml up -d (usa MSSQL_SA_PASSWORD_TEST)
- Middleware GlobalExceptionHandler convierte excepciones en respuestas JSON.
- CORS abierto solo para IPs locales; endurecer antes de producción.
- Seeder TestDataSeeder se ejecuta solo en ambiente Testing.
- Mantén cadenas de conexión y configuraciones en env vars.
Frontend – TransporteFront  
(Usa TransporteFront/AGENTS.md para instrucciones detalladas)
- Stack: React 19, Vite, Tailwind 4, TanStack Query, React Router, Axios.
- Arquitectura Screaming: src/app, src/shared, src/api, src/config, y dominios (titulares, pasajeros, pagos, reinscripciones).
- Scripts: npm run dev, npm run build, npm run lint, npm run preview.
- Cliente Axios (src/api/client.ts) centraliza interceptor y manejo de errores.
- Query keys por dominio (titularesKeys, etc.) para invalidaciones consistentes.
- UI utiliza shared/ui y layout MainLayout; tailwind con paleta #007a8a y soporte dark.
- Config .env: VITE_API_BASE_URL (default http://localhost:5074/api). Vite server host: '0.0.0.0' para red local.
Infraestructura y Workflows
- Docker: docker-compose.yml (SQL base) y docker-compose.testing.yml (SQL Testing).
- Flujo local recomendado:
  1. docker-compose -f docker-compose.testing.yml up -d
  2. Backend Testing
  3. Frontend npm run dev
- DESARROLLO-RED-LOCAL.md documenta cómo exponer backend/frontend en la red y ajustar firewall.
- Testing:
  - Backend: preparar dotnet test (no hay proyecto aún).
  - Frontend: npm run lint. Tests futuros con Vitest/RTL/Playwright (usa skill playwright).
- Troubleshooting: revisar CORS/IPs, logs del middleware, firewall/host.
Sincronización Backend↔Frontend
- Cambios en controllers → actualiza services/*.api.ts, services/*.queries.ts, y tipos src/<dominio>/types.
- Pagos/paginación: mantén paridad entre PaginationModel (backend) y los tipos de frontend.
- Invalidar caches TanStack Query tras mutaciones (queryClient.invalidateQueries).
Seguridad y Buenas Prácticas
- No combines AllowCredentials con orígenes abiertos. Usa HTTPS y dominios específicos.
- Variables sensibles siempre por entorno.
- DESARROLLO-RED-LOCAL.md es solo referencia local; no lo mezcles en ambientes con datos reales.
- Elimina .env y .sql antes de compartir artefactos.
Checklist rápido antes de terminar una tarea
- Backend:
  - Migraciones aplicadas (dotnet ef database update).
  - Swagger en http://localhost:5074/swagger funciona.
- Frontend:
  - npm run lint sin errores.
  - Tipos/queries alineados con DTOs recientes.
- General:
  - Docker DB activo, seeder solo en Testing.
  - Nada sensible en commits.
  - Documentaste cualquier configuración nueva.
---
