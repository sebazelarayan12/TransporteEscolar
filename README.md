# Transporte – Monorepo de Gestión de Transporte Escolar

Plataforma integral para administrar el servicio de transporte escolar: titulares (responsables de pago), pasajeros (estudiantes), pagos mensuales y procesos de reinscripción. Este repositorio reúne el backend (.NET 8 + PostgreSQL) y el frontend (React 19 + Vite) bajo una arquitectura limpia y modular.

---

## 🚧 Arquitectura General

- **Backend – Clean Architecture**: Capas Domain, Application, Infrastructure y Api. Cada cambio se orquesta a través de servicios registrados en `ServiceCollectionExtensions.cs`, expuestos mediante controllers REST y respaldados por EF Core 8.
- **Frontend – Screaming Architecture**: Carpetas por dominio (`titulares`, `pasajeros`, `pagos`, `reinscripciones`) sobre Vite + React 19. Los datos se consumen mediante TanStack Query y un cliente Axios centralizado.
- **Sincronización API ↔ Frontend**: Cuando cambie un controller/DTO del backend debes actualizar `services/*.api.ts`, `*.queries.ts` y los tipos de cada dominio para mantener contratos alineados.

---

## 🗂️ Estructura del Repositorio

```text
.
├── TransporteEscolar/           # Solución .NET 8 (Domain/Application/Infrastructure/Api)
├── TransporteFront/             # Aplicación React 19 + Vite
├── docker-compose.testing.yml   # PostgreSQL 16 listo para Testing (puerto 5433)
├── docker-compose.yml           # Stack base para otros entornos
├── DESARROLLO-RED-LOCAL.md      # Guía para exponer servicios en LAN
├── recarga.md                   # Contexto operativo de la última sesión (no versionado)
└── AGENTS.md                    # Normativa global y habilidades para agentes
```

---

## 🧱 Stack Tecnológico

| Capa | Tecnologías clave | Notas |
| --- | --- | --- |
| Backend | .NET 8, ASP.NET Core Web API, EF Core 8, PostgreSQL 16 (Docker) | Perfil obligatorio `Testing`, puerto 5074, seeder automático solo en Testing |
| Frontend | React 19, Vite 7, TypeScript 5.9, TailwindCSS 4, TanStack Query 5, React Router 7, Axios | Dev server en puerto 5173, sin `useMemo`/`useCallback` por compatibilidad React 19 Compiler |
| Infraestructura | Docker Compose, contenedor PostgreSQL (`transporte-test-db`) | Flujo recomendado: docker-compose Testing → `dotnet run` → `npm run dev` |

---

## ✅ Requisitos Previos

- Docker Desktop 4.x o compatible con Compose v2.
- .NET SDK 8.0.201 o superior.
- Node.js 20.x + npm 10.x.
- PowerShell/Bash para ejecutar los comandos descritos.

---

## ⚙️ Configuración de Entorno

### Variables Backend

Configura estas variables al lanzar `TransporteEscolar.Api` (puedes usar `.runsettings`, `appsettings.Testing.json` o variables de entorno):

```bash
ASPNETCORE_ENVIRONMENT=Testing
ConnectionStrings__Default="Host=localhost;Port=5433;Database=TransporteEscolarDb_Test;Username=postgres;Password=Testing2026;Include Error Detail=true"
```

- Mantén el seeder `TestDataSeeder` habilitado únicamente en `Testing` para evitar escrituras en producción (Neon.tech).
- Todos los `DateTime/DateOnly` deben persistirse en UTC para cumplir con PostgreSQL.

### Variables Frontend

Crear `TransporteFront/.env` (no versionar):

```bash
VITE_API_BASE_URL=http://localhost:5074/api
```

- El cliente Axios (`src/api/client.ts`) toma esta URL para todas las llamadas. No hardcodees rutas absolutas en componentes.

### Puertos y perfiles

| Servicio | Puerto | Detalle |
| --- | --- | --- |
| API (.NET) | 5074 | Perfil `Testing`, Swagger disponible en `/swagger` |
| Frontend (Vite) | 5173 | Host `0.0.0.0` listo para pruebas en red local |
| PostgreSQL (Docker Testing) | 5433 | Contenedor definido en `docker-compose.testing.yml` |

---

## ▶️ Puesta en Marcha (Flujo Recomendado)

1. **Base de datos**
   ```bash
   docker compose -f docker-compose.testing.yml up -d
   docker logs -f transporte-test-db   # Opcional: verificar salud
   ```
2. **Migraciones** (solo si hubo cambios de esquema)
   ```bash
   cd TransporteEscolar/TransporteEscolar.Infrastructure
   dotnet ef database update --startup-project ../TransporteEscolar.Api
   ```
3. **Backend (perfil Testing)**
   ```bash
   cd ../TransporteEscolar.Api
   dotnet run --launch-profile Testing
   ```
4. **Frontend**
   ```bash
   cd ../../TransporteFront
   npm install
   npm run dev
   ```

> Este pipeline (Docker → `dotnet run` → `npm run dev`) garantiza que el backend ya esté exponiendo los contratos antes de levantar la UI.

---

## 🗄️ Migraciones y Base de Datos

- Para **crear** una nueva migración:
  ```bash
  cd TransporteEscolar/TransporteEscolar.Infrastructure
  dotnet ef migrations add NombreMigracion --startup-project ../TransporteEscolar.Api
  ```
- Para **aplicar** migraciones (local o CI):
  ```bash
  dotnet ef database update --startup-project ../TransporteEscolar.Api
  ```
- PostgreSQL vive únicamente en Docker local (`transporte-test-db`). Neon.tech cubre entornos productivos.
- Nunca ejecutes el seeder fuera del perfil `Testing`.

---

## 🔄 Sincronización Backend ↔ Frontend

- Los controladores deben exponer DTOs dedicados (no entidades EF). Cualquier cambio exige actualizar los tipos y servicios en `TransporteFront/src/<dominio>/services` y `src/<dominio>/types`.
- Las operaciones TanStack Query deben invalidar las claves del dominio (`titularesKeys`, `pagosKeys`, etc.) tras cada mutación.
- Mantén la paridad entre modelos de paginación/backend (`PaginationModel`) y los tipos compartidos del frontend (`PaginatedResponse`).

---

## 🧪 Testing y Calidad

| Área | Comando | Estado |
| --- | --- | --- |
| Frontend (lint) | `npm run lint` | Activo – debe pasar antes de cualquier commit |
| Backend (tests) | `dotnet test` | Preparado a nivel de solución, pendiente incorporar proyectos de prueba |
| Validación manual | Navegar flujo completo (login no requerido), registrar pagos, reinscribir pasajeros | Obligatorio tras cambios críticos |

- Para depuración, apóyate en `api.log` y en los logs del middleware `GlobalExceptionHandler`.

---

## 🔐 Seguridad y Buenas Prácticas

- CORS abierto solo para orígenes locales durante desarrollo; antes de desplegar restringe dominios y habilita HTTPS.
- No mezclar `AllowAnyOrigin` con `AllowCredentials` en producción.
- Variables sensibles (`ConnectionStrings__Default`, `VITE_API_BASE_URL`, credenciales Neon) jamás deben versionarse.
- El archivo `recarga.md` queda ignorado por Git y se usa para documentar el contexto operativo diario.
- Consulta `DESARROLLO-RED-LOCAL.md` si necesitas exponer Backend/Frontend dentro de la red.

---

## 🧰 Comandos Útiles

```bash
# Revisar versión de PostgreSQL ejecutando dentro del contenedor de Testing
docker compose -f docker-compose.testing.yml exec postgres-test psql -U postgres -d TransporteEscolarDb_Test -c "SELECT version();"

# Listar bases disponibles
docker compose -f docker-compose.testing.yml exec postgres-test psql -U postgres -c "\l"

# Detener servicios de prueba
docker compose -f docker-compose.testing.yml down
```

---

## 🚀 Próximos Pasos (Roadmap Corto Plazo)

1. Normalizar todos los `DateTime/DateOnly` a UTC antes de los siguientes releases.
2. Limpiar deudas de meses futuros según reglas de negocio de pagos mensuales.
3. Agregar unit tests (Vitest) para helpers y hooks financieros (`useSaldoPrioritario`).
4. Incorporar E2E con Playwright para el flujo completo de pagos.
5. Implementar edición de pasajeros y enriquecer estados de pagos (confirmado/pendiente).

---

## 📎 Recursos Complementarios

- `AGENTS.md` (raíz): lineamientos globales, skills obligatorias e instrucciones de seguridad.
- `TransporteEscolar/AGENTS.md`: reglas precisas para el backend (migraciones, DI, naming).
- `TransporteFront/AGENTS.md`: convenciones de UI, TanStack Query y Tailwind.
- `recarga.md`: resumen vivo de la última sesión (se actualiza cuando el usuario pide “guarda todo”).

Mantén este README como la referencia central del monorepo. Si cambias el stack, los comandos o las prácticas clave, actualiza este documento junto con `recarga.md` para evitar pérdida de contexto.
