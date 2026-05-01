# AGENTS Transporte

## Recarga obligatoria
- Ejecuta `cat recarga.md` al inicio de cada sesion y lee todo sin saltar secciones.
- Si el archivo falta continua trabajando pero prepara datos para recrearlo cuando se ordene.
- Nunca subas `recarga.md`; permanece en .gitignore y se mantiene local.
- Documenta riesgos y decisiones durante la sesion y no reutilices datos viejos si contradicen hallazgos recientes.
- Ante conflictos sigue prioridad: este AGENTS, luego los AGENTS de dominio y por ultimo comentarios del repo.

## Guarda todo template
- El comando "guarda todo" obliga a regenerar `recarga.md` sin tildes y con la plantilla completa.
- Completa todos los campos aun si se repiten y actualiza fecha y hora reales antes de cerrar.
- Usa "Pendiente" solo cuando realmente no exista informacion disponible.
- Plantilla oficial:
````markdown
# Contexto de Sesion - Transporte Escolar
**Ultima actualizacion**: [fecha y hora actual]
---
## Idea General del Proyecto
[Descripcion breve del proposito del sistema y entidades]
---
## Stack Tecnologico
### Backend
- .NET 8, ASP.NET Core Web API
- Entity Framework Core 8
- SQL Server en Docker puerto 1433
- Perfil Testing en puerto 5074
### Frontend
- React 19 + Vite 7
- TypeScript 5.9, TailwindCSS 4, TanStack Query 5, React Router 7, Axios
- Puerto 5173 host 0.0.0.0
### Arquitectura
- Backend: Domain / Application / Infrastructure / Api
- Frontend: Screaming Architecture por dominios
---
## Ultimos Cambios
### [Fecha] - [Titulo]
**Archivos:** `ruta/archivo1`, `ruta/archivo2`
**Que se hizo:** Detalle 1; Detalle 2
**Decisiones:** Motivo de la solucion; Patrones aplicados
**Estado:** OK Resultado; Pendiente por resolver
---
### [Fecha anterior] - [Cambio]
[Repite la estructura para 3-5 hitos]
---
## Patrones clave
### Frontend
- Nunca usar `useMemo` ni `useCallback`
- No usar `var()` dentro de className
- Inputs numericos con `z.coerce.number()`
- Query keys agrupadas por dominio
### Backend
- Servicios registrados en `ServiceCollectionExtensions`
- Migraciones desde `TransporteEscolar.Infrastructure`
- Errores via `GlobalExceptionHandler`
---
## Archivos destacados
- `ruta/a`, `ruta/b` (maximo 10-15 entradas)
---
## Proximos pasos
- [ ] Item 1, Item 2, Item 3
---
## Comandos rapidos
```bash
docker-compose -f docker-compose.testing.yml up -d
cd TransporteEscolar/TransporteEscolar.Api && dotnet run --launch-profile Testing
cd TransporteFront && npm run dev && npm run lint && npm run build
cd TransporteEscolar/TransporteEscolar.Infrastructure
```
````

## Panorama del repositorio
- Monorepo Transporte con `TransporteEscolar` (backend) y `TransporteFront` (frontend) mas archivos Docker en la raiz.
- Backend expone APIs REST limpias en perfil Testing 5074 y el frontend React 19 + Vite 7 sirve en 5173 consumiendo TanStack Query.
- SQL Server corre en Docker en 1433; aseguralo antes de correr migraciones o pruebas.
- Dominios clave: titulares, pasajeros, pagos, reinscripciones; mantener contratos sincronizados entre capas.

## Build, lint y test
- Backend: `dotnet restore && dotnet build TransporteEscolar.sln` y luego `dotnet test TransporteEscolar.sln` con Docker Testing levantado.
- `npm install` una vez por sesion seguido de `npm run lint` y `npm run build`.
- `npm run dev` sirve la UI en 5173 para validaciones manuales.
- `docker-compose -f docker-compose.testing.yml up -d` levanta la base; usa `down` al cerrar la sesion.
- Ejecuta suites completas antes de solicitar revision o abrir PR.

## Pruebas unitarias individuales
- Backend: `dotnet test TransporteEscolar.sln --filter FullyQualifiedName~NombreDelTest`.
- Frontend: `npm run test -- Dominio` usando Vitest; remueve filtros antes de commitear y documenta pendientes en `recarga.md` si quedan fallos abiertos.

## Workflows esenciales
1. Base de datos: levanta Docker Testing antes de ejecutar seeds o Api.
2. Backend: corre `dotnet run --launch-profile Testing` desde Api para validar endpoints reales.
3. Frontend: arranca `npm run dev` y revisa rutas titulares, pasajeros, pagos y reinscripciones.
4. Deploy: sincroniza cambios backend/frontend antes de empujar a Railway u otros entornos.
5. Documentacion y QA: actualiza `recarga.md`, este AGENTS y registra hallazgos con enlaces a commits.

## Estilo backend
- Respeta el flujo Domain -> Application -> Infrastructure -> Api sin dependencias inversas.
- Registra servicios y repositorios en `ServiceCollectionExtensions` y usa inyeccion de dependencias.
- Prefiere records o clases inmutables para DTOs expuestos por la Api.
- Propaga `CancellationToken` en servicios asincronos y repositorios.
- Repositorios filtran titulares activos y evitan consultas costosas sin paginar.
- Los errores se canalizan via `GlobalExceptionHandlerMiddleware`; no silencies excepciones.
- Genera migraciones desde `TransporteEscolar.Infrastructure` apuntando a `TransporteEscolar.Api` y mantiene configuraciones sensibles en variables de entorno o `appsettings.Testing.json`.

## Estilo frontend
- Arquitectura por dominio: cada carpeta contiene pages, components, hooks, services y types dedicados.
- Formularios usan react-hook-form con validaciones Zod v4 y helpers compartidos.
- Inputs numericos se parsean con `z.coerce.number()` y montos usan `PriceInput`.
- TanStack Query agrupa keys por dominio e invalida caches despues de mutaciones.
- Prohibido `useMemo` y `useCallback` salvo dependencia externa documentada.
- No usar `var()` en className; define tokens en Tailwind 4 y combinaciones via helpers.
- Ordena imports (externas, alias compartidos, rutas relativas) y evita comentarios triviales manteniendo props tipadas.

## Skills auto invoke
- **brainstorming**: nuevas caracteristicas, flujos o copy creativo.
- **systematic-debugging**: bugs, regresiones o errores de build.
- **csharp-developer**: servicios, repositorios, controllers o EF Core.
- **api-design-principles**: contratos REST, versionado y payloads.
- **error-handling-patterns**: middleware, filtros y politicas de excepcion.
- **react-19**: componentes, hooks, routing y TanStack Query.
- **tailwind-4** junto con **frontend-design** o **interface-design** en tareas de UI.
- **vercel-react-best-practices**: diagnosticos y optimizaciones en React.
- **typescript** y **zod-4**: definicion de tipos estrictos y validaciones.
- **vitest** o **playwright**: pruebas unitarias o E2E.
- **better-auth-best-practices**: autenticacion, interceptores y proteccion de rutas.

## React doctor
- Corre `npx -y react-doctor@latest . --verbose --diff` despues de cada cambio dentro de `TransporteFront`.
- Resuelve todas las advertencias y vuelve a ejecutar la herramienta hasta obtener salida limpia.
- Documenta en `recarga.md` si algun hallazgo permanece abierto, describe el motivo y adjunta resultados relevantes al preparar PRs o handoff.

## Seguridad
- Nunca agregues archivos `.env`, `.sql` ni `recarga.md` a un commit.
- Usa variables de entorno para credenciales y no hardcodees secretos.
- Respeta los puertos asignados: 5074 backend, 5173 frontend, 1433 SQL.
- Configura CORS y HTTPS antes de exponer servicios fuera de la red local.
- Evita registrar datos personales en logs persistentes y limpia dumps sensibles.
- Consulta `DESARROLLO-RED-LOCAL.md` antes de abrir el Api hacia la red.

## Checklist final
1. Docker Testing arriba sin errores.
2. `dotnet build` y `dotnet test` completados.
3. `npm run lint` y `npm run build` exitosos.
4. `react-doctor` limpio cuando hubo cambios en la UI.
5. Contratos backend/frontend sincronizados y documentados.
6. `recarga.md` actualizado si hubo orden de "guarda todo" o hallazgos relevantes.
7. Git sin cambios pendientes y hooks superados antes de pedir revision.
8. Pendientes y riesgos anotados para la siguiente sesion.
