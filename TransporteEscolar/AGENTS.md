# TransporteEscolar API – AI Agent Ruleset

## Rol y Alcance
Eres el agente dedicado al backend (.NET 8 + EF Core) del sistema Transporte Escolar. Recibes tareas delegadas por el orquestador y debes seguir estas reglas antes de tocar código:
1. Lee por completo este archivo para conocer el contexto vigente y las restricciones.
2. Invoca los skills obligatorios antes de escribir código (ver tabla). Usa los skills opcionales cuando la tarea lo sugiera.
3. Tras completar una tarea, ACTUALIZA la sección **Context Snapshot** (subapartados “Recent Backend Changes” y “Key Files Watchlist”) con la información nueva.

## Skills Reference
- **brainstorming** – Diverge cuando se diseñan nuevas features, reglas de negocio o flujos.
- **systematic-debugging** – Proceso estructurado para investigar excepciones, regresiones o bugs.
- **csharp-developer** – Patrones ASP.NET Core 8, EF Core, CQRS light y DI.
- **api-design-principles** – Buenas prácticas REST, contratos HTTP, códigos de estado.
- **error-handling-patterns** – Middleware, excepciones, respuestas tipificadas.

## Auto-invoke Skills
| Acción | Skill |
| --- | --- |
| Diseñar nuevas funcionalidades/servicios backend | brainstorming |
| Depurar fallos de API, excepciones, deadlocks | systematic-debugging |
| Crear/editar controllers, services, repos, mappers | csharp-developer |
| Definir o versionar endpoints REST | api-design-principles |
| Intervenir middleware, filtros, manejo de errores | error-handling-patterns |

## Context Snapshot (marzo 2026) – mantener siempre al día
### Domain Overview
- **Titulares & Pasajeros**: responsables de pago y alumnos. CRUD completo con validaciones y teléfonos principales.
- **Pagos Mensuales**: entidades `PagoMensual` y `MovimientoPago`. Servicios en Application gestionan generación, deuda y endpoints `/pagosmensuales/pendientes`, `/vencidos`, `/titulares-con-pagos`.
- **Reinscripciones**: usa modal embebida en frontend; backend expone endpoints reutilizando `TitularMapper`.
- **Gastos/Ingresos**: módulos en progreso para tablero financiero; release notes controlan avisos desde `appsettings`.
- **WhatsApp Lotes**: conjunto de endpoints (`/whatsapp/lotes`) y servicios para programar envíos; autenticación via HttpClient.

### Infraestructura actual
- Clean Architecture dividida en Domain/Application/Infrastructure/Api.
- `TransporteEscolar.Api/Program.cs` carga `.env` mediante `DotEnvLoader` antes de construir el host.
- Configuración sensible va por variables: `ConnectionStrings__SqlServer`, `MetaWhatsApp__*`, `AllowedOrigins`, `ReleaseNotes__Descripcion`.
- Seeder `TestDataSeeder` únicamente en perfil `Testing`.

### Recent Backend Changes
- Loader `.env` agregado (mar 2026) para externalizar secretos.
- Endpoint `GET /pagosmensuales/titulares-con-pagos` y servicio de paginación para búsqueda de titulares con cuotas activas.
- API de lotes WhatsApp + webhook de estado y migración `AddWhatsAppLotesMensajes`.
- ReleaseNotes: texto “Pagina de gastos" para habilitar banner en frontend.

### Key Files Watchlist
- `TransporteEscolar.Api/Program.cs` – configuración general, CORS, `DotEnvLoader`.
- `TransporteEscolar.Api/DependencyInjection/ServiceCollectionExtensions.cs` – registro obligatorio de servicios/repos.
- `TransporteEscolar.Application/PagosMensuales` – DTOs, handlers y servicios para cuotas.
- `TransporteEscolar.Application/WhatsApp` + `Infrastructure/WhatsApp` – lógica de lotes y HttpClient autenticado.
- `TransporteEscolar.Infrastructure/Persistence/AppDbContext.cs` – modelo EF, conversiones DateOnly.
- `TransporteEscolar.Infrastructure/Migrations` – mantener historial limpio.
- `TransporteEscolar.Domain` – entidades con constructores controlados y enums.

### Update Protocol (obligatorio)
1. Cada vez que cierres una tarea backend, agrega un resumen de los cambios más recientes en “Recent Backend Changes” (menciona fecha y foco).
2. Actualiza “Key Files Watchlist” si tocaste archivos relevantes nuevos o eliminaste otros.
3. Si la tarea introduce nuevas dependencias o configuraciones, anótalas en “Infraestructura actual”.
4. No marques la tarea delegada como completa hasta reflejar el contexto.

## Architecture Guardrails
- **Domain**: entidades con claves GUID/int, propiedades privadas y métodos de fábrica. No uses `new` directo en controllers.
- **Application**: servicios orquestan casos de uso; nunca acceden a HttpContext. Usa DTOs en `Models/` y validaciones antes de tocar repositorios.
- **Infrastructure**: repos implementan interfaces de Application, usan `AppDbContext` y `AsNoTracking` para lecturas. Nunca hagas SQL plano salvo necesidad documentada.
- **API**: controllers en `TransporteEscolar.Api/Controllers`, decorados con `[ApiController]` y `[Route("api/[controller]")]`. Responden DTOs, no entidades EF.
- **Errores**: lanza excepciones específicas y deja que `GlobalExceptionHandler` convierta en JSON consistente.
- **Configuración**: CORS solo IPs necesarias; jamás combines `AllowAnyOrigin` con credenciales activas.
- **Seeder/Migraciones**: ejecuta seeder solo en Testing. Cada cambio de esquema requiere migración desde `TransporteEscolar.Infrastructure` (usa `--startup-project ../TransporteEscolar.Api`).

## Decision Guides
1. **¿Dónde implementar lógica?**
   - Regla: si la lógica involucra reglas de negocio/persistencia, colócala en Application (servicios/handlers). Controllers deben mapear peticiones ↔ servicios.
2. **¿Cuándo crear un nuevo servicio vs. extender uno existente?**
   - Si el flujo afecta una entidad ya administrada (p.ej., `PagosMensuales`), extiende el servicio actual manteniendo métodos idempotentes. Crea un servicio nuevo solo para agregados independientes o integraciones externas (p.ej., WhatsApp).

## Commands & Tooling
```bash
# Restaurar y compilar
 dotnet restore && dotnet build TransporteEscolar.sln

# Ejecutar API con perfil Testing
 cd TransporteEscolar/TransporteEscolar.Api && dotnet run --launch-profile Testing

# Migraciones
 cd TransporteEscolar/TransporteEscolar.Infrastructure
 dotnet ef migrations add NombreMigracion --startup-project ../TransporteEscolar.Api
 dotnet ef database update --startup-project ../TransporteEscolar.Api

# Base de datos (docker)
 docker-compose -f ../../docker-compose.testing.yml up -d
```

## QA Checklist antes de entregar
- [ ] Migraciones creadas y aplicadas (o confirmado que no eran necesarias).
- [ ] Seeder limitado al perfil Testing.
- [ ] Swagger en http://localhost:5074/swagger responde y refleja nuevos endpoints.
- [ ] DTOs y mappers actualizados; ningún controller devuelve entidades EF.
- [ ] ReleaseNotes/Feature flags documentados si cambiaron.
- [ ] No hay credenciales ni `.env` en el repo.

## Naming & Conventions
| Componente | Convención | Ejemplo |
| --- | --- | --- |
| Services | `<Entidad>Service` + interfaz `I<Entidad>Service` | `PagoMensualService` |
| Repositorios | `<Entidad>Repository` implementa `I<Entidad>Repository` | `TitularRepository` |
| DTO Requests | `<Entidad><Accion>Request` | `CrearPagoMensualRequest` |
| DTO Responses | `<Entidad>Response` o `<Entidad>Summary` | `PagoMensualResponse` |
| Validators | `<Entidad>Validator` en Application | `TitularValidator` |
| Controllers | `<Entidades>Controller` | `PagosMensualesController` |

## API Contracts
- JSON en `camelCase`, fechas `YYYY-MM-DD` (usa converters). Campos monetarios en enteros/decimal según entidad.
- Paginación: `pageNumber`, `pageSize`, `search`, `mes`, `anio`.
- Usa códigos HTTP: `200/201/204` para éxitos, `400/404/409` según corresponda. Errores se devuelven como `{ type, title, status, errors? }` del middleware.

Mantén este documento actualizado: el orquestador valida que cada entrega que toque backend incluya la actualización correspondiente.
