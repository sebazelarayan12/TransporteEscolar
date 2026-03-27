0. Regla global inamovible
   - Nunca escribas tildes en ninguna palabra ni mensaje, sin importar el contexto.

1. Header & Skills Reference
   - Title: “TransporteEscolar API – AI Agent Ruleset”.
   - “Skills Reference” list will include backend-relevant skills: csharp-developer, systematic-debugging, api-design-principles, error-handling-patterns, brainstorming, plus testing/infra skills such as playwright? No, backend-specific include csharp-developer, systematic-debugging, api-design-principles, error-handling-patterns, maybe general brainstorming for creative changes. Possibly mention typescript? not needed for backend. Incluye también vitest para guiar pruebas unitarias compartidas/front (Vitest) cuando sean relevantes.
   - Provide short descriptions referencing .agents/skills/....
2. Auto-invoke Skills table
   - Mirror format (Action | Skill). Actions tailored to backend:
     - “Diseñar nuevas features o flujos backend” → brainstorming.
     - “Depurar excepciones, fallos de API” → systematic-debugging.
     - “Crear/editar controllers, services, repos” → csharp-developer.
     - “Diseñar endpoints REST, contratos HTTP” → api-design-principles.
     - “Añadir middleware/manejo de errores” → error-handling-patterns.
      - “Crear tests backend (cuando existan)” → maybe systematic-debugging or upcoming test skill (none). Could include systematic-debugging.
      - “Escribir/ajustar pruebas unitarias con Vitest (front/shared)” → vitest.
     - “Planear migraciones/DB” -> csharp-developer.
     - “Tareas creativas (nuevas reglas)” -> brainstorming.
   - Possibly include “Investigating CORS/security” -> error-handling-patterns? Maybe not.
   - Keep table concise.
3. Critical Rules – Non-negotiable
    - Sections: Domain Entities, Application Layer (DTOs/Services), Infrastructure/Repositories, API Controllers, Validation, Migrations & DB, CORS/Security, Seeder usage.
    - PagosMensuales module ya funciona con CQRS + MediatR: usa queries/commands bajo `Application/PagosMensuales`, `ISender` en controladores/servicios, `PagoMensualMappingExtensions` / `PagoMovimientoMappingExtensions` para responses y métodos ricos (`AplicarPago`, `RegistrarPago`, `AjustarMonto`, `GenerarPagos`) dentro de las entidades. Nunca reintroduzcas `IPagoMensualService`; cualquier nueva regla va al Dominio o a un handler.
    - Pasajeros ahora sigue el mismo patrón CQRS/MediatR: `PasajerosController` opera con `ISender`, los comandos/queries viven en `Application/Pasajeros/*`, los mapeos están en `PasajeroMappingExtensions` y `ReinscripcionMappingExtensions`, y las reglas (horarios, prioridades, reinscripciones) se resuelven con métodos del agregado `Pasajero`. Evita revivir `IPasajeroService` o manipular `PasajeroHorario` a través de repos de infraestructura; todo pasa por el agregado y MediatR.
   - Each with ALWAYS/NEVER instructions (like example). Example:
     - Domain Entities: ALWAYS use private setters, managed constructors; NEVER expose EF navigation modifications outside services.
     - Application: ALWAYS validate via Validation/*, ALWAYS map DTOs using MapearAResponse, NEVER access DbContext from controller.
     - Infrastructure: ALWAYS register repos/services via DI; ALWAYS use AppDbContext with EF configurations; NEVER run raw SQL unchecked.
     - API: ALWAYS decorate controllers with [ApiController], route api/[controller], use logging. ALWAYS return DTOs; NEVER return EF entities.
     - Validation: ALWAYS throw ValidationException.
     - CORS/Env: ALWAYS restrict CORS for prod; NEVER use AllowCredentials with AllowAnyOrigin.
     - Seeder: ALWAYS run only in Testing; NEVER in Production.
     - Testing: ALWAYS run dotnet run --launch-profile Testing etc.
4. Decision Trees
   - Example sections: “Service vs Controller logic” (if logic > simple mapping -> service). Or “Seeder usage” (Testing only). Maybe “Migrations vs manual SQL” (Schema change -> migration). Provide 2 mini decision trees akin to example: e.g., “Where to implement change (Domain vs Application vs Infrastructure vs Api)”.
5. Tech Stack
   - .NET 8 | ASP.NET Core Web API | EF Core 8 | SQL Server 2022 | Docker Compose.
   - Maybe mention JSON serialization (System.Text.Json) and Logging.
6. Project Structure
   - Outline directories under TransporteEscolar/: TransporteEscolar.Domain, .Application, .Infrastructure, .Api.
   - Provide subfolders comments (Entities, DTOs, Services, etc).
   - Mention AppDbContext, DependencyInjection, Middleware, Converters, Controllers, Persistence/Seeders.
7. Commands
   - Development: dotnet run --launch-profile Testing.
   - Database: dotnet ef migrations add, dotnet ef database update.
   - Docker: docker-compose -f docker-compose.testing.yml up -d.
   - Testing/Linting: dotnet test (placeholder).
   - Possibly mention dotnet tool restore? not necessary.
8. QA Checklist
   - Items: DB migrations created & applied; Seeder limited to Testing; dotnet run --launch-profile Testing works; CORS/IPs verified; DTOs updated and controllers returning correct types; Logging added for create/update operations; Swagger accessible; No sensitive data in config.
9. Naming Conventions
   - Use table similar to example: e.g., Entity patterns:
     - DTO request/response: <Entity>Model.Request/Response.
     - Service interface/class: I<Entity>Service / <Entity>Service.
     - Repository: I<Entity>Repository / <Entity>Repository.
     - Controller: <Entities>Controller.
     - Validation: <Entity>Validator.
     - DbContext: AppDbContext.
   - Provide examples.
10. API Conventions
    - Document base route api/[controller].
    - JSON serialization: camelCase, DateOnly formatted YYYY-MM-DD, aim for typed DTOs.
    - Pagination query params search, pageNumber, pageSize.
    - Standard responses (200/201/204) and error handling (middleware).
    - Soft delete patterns (FechaBaja). Maybe include sample JSON.
11. Wrap up: Provide final text.
Need ensure referencing instructions to consult orchestrator? maybe mention at top? But this file specific? Should state orchestrator is boss? maybe not necessary. Provide final text only? user wants text final to paste.
Will produce final text in requested format referencing actual project.
Need include relevant skills. Must mention brainstorming etc. Provide table.
Ok craft final text. Need sample sections:
Title: “TransporteEscolar API – AI Agent Ruleset”.
Add Skills Reference bullet list.
Auto-invoke table.
Critical rules with sub-sections bullet.
Decision trees.
Tech stack.
Project structure.
Commands.
QA checklist.
Naming conventions table.
API conventions (maybe restful guidelines). Provide example JSON.
Also mention seeder/dB specifics.
Ensure instructions referencing orchestrator? not necessary.
Now final answer.
