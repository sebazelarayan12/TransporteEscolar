# Diciembre: confirmación por titular y cuota propia — Plan

> Estado: **DISEÑO ACORDADO, SIN IMPLEMENTAR** (2026-11-20). Engram: #647 (regla), #648 (decisiones).
> Ejecutar con superpowers:subagent-driven-development. Subagentes `haiku` (model explícito), principal revisa diff + tests.

## Regla de negocio

En diciembre el servicio no es normal: las clases duran 1-2 semanas, se cobra un monto distinto y muchos titulares no mandan a sus hijos. Hay que verificar **titular por titular** si va, y fijar el **monto de diciembre de cada uno** (distinto por titular).

## Decisiones acordadas con el dueño

1. Monto por titular, cada uno el suyo.
2. UI: **pestaña "Diciembre"** dentro de la página de reinscripciones (`ReinscripcionesListPage`).
3. Se **registra la decisión** de cada titular: pendiente / va / no va. "No va" = sin cuota.
4. **No ensuciar** el flujo de reinscripciones de principio de año: entidad, endpoints y componentes propios; no se modifica `Reinscripcion`.
5. Al marcar "va", el monto viene **precargado con `MontoMensualPactado`** y es editable.

## Hallazgos del código (verificados)

- `GenerarPagosMensualesAutomaticosCommand` genera marzo–noviembre (`mesFin = 11`). Diciembre no existe como cuota.
- `Titular.GenerarPagos` clampa `mesInicio >= 3` y `mesFin <= 11`: **no sirve** para diciembre. Hace falta un método de dominio nuevo.
- `PagoMensual` soporta mes 1-12 (`PagoMensualValidator` valida 1-12). Vencimiento = día 10 del mes (`CrearFechaVencimiento`).
- `DashboardService` y el gráfico ya recorren marzo–diciembre: la cuota de diciembre aparecerá sola en recaudación.
- `DashboardRepository` filtra pendientes/vencidos por `p.Mes == mesActual`: en diciembre la cuota nueva cuenta como pendiente/vencida del mes actual. Es correcto, pero verificarlo en tests.
- Regla vigente: el servicio se corta al segundo mes impago (sin deuda acumulada). Debe seguir valiendo; no se toca.

## Preguntas abiertas: CONFIRMADAS por el dueño el 2026-11-20 (los 5 defaults valen tal cual)

- **Reversibilidad:** pasar de "va" a "no va" solo si la cuota de diciembre no tiene movimientos de pago; si tiene, se rechaza con `BusinessRuleException`. Pasar de "no va" a "va" crea la cuota.
- **Editar monto** de una cuota ya creada y sin pagos: permitido (reutiliza `PagoMensual.ActualizarMontoGenerado`). Con pagos: no puede quedar por debajo del total pagado (misma regla de `AjustarMonto`).
- **Alcance de titulares:** solo titulares activos (sin `FechaBaja`) con al menos un pasajero activo.
- **Año:** diciembre del año en curso (`DateTime.UtcNow.Year`), con selector igual al de reinscripciones si ya existe `anio` en el hook.
- **Notificación/push** al crear cuota de diciembre: NO por defecto (no spamear familias). Confirmar.

## Contrato de API (CONGELADO; backend y front lo implementan tal cual)

JSON en camelCase (default de ASP.NET). Enum como string. Sin `[Authorize]` en el controller: la `FallbackPolicy` JWT ya lo protege (igual que `ReinscripcionesController`).

`GET /api/diciembre?anio=2026` (anio opcional, default año UTC actual; <2000 o >2100 → 400) → 200:
```json
{
  "anio": 2026,
  "titulares": [
    {
      "titularId": 1,
      "apellido": "PEREZ",
      "nombreContacto": "Ana",
      "pasajeros": ["Juan", "Sofi"],
      "estado": "Pendiente",
      "montoPactado": 120000.00,
      "montoDiciembre": null,
      "pagoMensualId": null,
      "totalPagado": 0.00,
      "cuotaPreexistente": false
    }
  ]
}
```
- `estado`: `"Pendiente"` (sin fila de confirmación) | `"Va"` | `"NoVa"`.
- `montoDiciembre`: monto de la cuota de diciembre si existe (confirmada o preexistente), si no `null`. `pagoMensualId` y `totalPagado` (suma de movimientos de esa cuota, 0 si no hay) idem.
- `cuotaPreexistente`: `true` si hay un `PagoMensual` mes 12 del año creado a mano y SIN fila de confirmación (estado `Pendiente`).
- Solo titulares con `FechaBaja == null` y al menos un pasajero con `FechaBaja == null`. `pasajeros` = nombres de pasajeros activos. Orden: apellido asc, luego nombreContacto.

`PUT /api/diciembre/titulares/{titularId}` body:
```json
{ "anio": 2026, "va": true, "monto": 60000.00 }
```
→ 200 con UN item (misma forma que un elemento de `titulares`, ya actualizado).
- `va = true`: `monto` obligatorio, > 0 y <= 10.000.000. Crea la cuota mes 12 (vencimiento día 10 de diciembre, observación `"Cuota de diciembre"`) o, si ya hay una cuota mes 12 del titular/año, la **adopta** (la vincula y actualiza el monto; el monto no puede quedar por debajo del total pagado). Crea/actualiza la fila de confirmación.
- `va = false`: `monto` se ignora. Si la cuota de diciembre existe y NO tiene movimientos → se elimina la cuota. Si tiene movimientos → 400 (`BusinessRuleException`, "No se puede marcar que no va: la cuota de diciembre ya tiene pagos registrados"). Crea/actualiza la fila de confirmación con `Va = false`, `Monto = null`, `PagoMensualId = null`.
- Idempotente: repetir el mismo PUT deja el mismo estado (200, sin duplicar cuota).
- Errores: 400 validación/regla de negocio, 404 titular inexistente, titular dado de baja o sin pasajeros activos (404 o 400 con mensaje claro).
- NO crea `Notificacion` ni push. NO toca `AjustarMonto` ni `GenerarPagos`.
- Atómico: fila de confirmación + alta/baja/edición de cuota en UN solo `SaveChangesAsync`. Prohibido usar `IPagoMensualRepository.AddAsync/UpdateAsync` (guardan al instante).

## Riesgos conocidos y decisiones (advisor, 2026-11-20)

- `PagoMensualRepository.DeleteFuturosByTitularIdAsync` usa `ExecuteDelete` (baja de titular): la FK `ConfirmacionDiciembre.PagoMensualId -> PagosMensuales` debe ser **`OnDelete(SetNull)`** y la FK a `Titulares` `Cascade`. Test: dar de baja un titular con diciembre confirmado no rompe.
- `AjustarMonto` pisa montos pendientes (incluido diciembre personalizado). Comportamiento existente, **NO se cambia**; se informa al dueño como interacción a decidir.
- Migración: SOLO `CreateTable` / `CreateIndex` / `AddForeignKey`. Cualquier otra operación → BLOQUEADO.
- Baseline de tests antes de empezar: **754 verdes** (`dotnet test` en `TransporteEscolar.Tests`).

## Arquitectura

- **Dominio:** entidad `ConfirmacionDiciembre` (`Id`, `TitularId`, `Anio`, `Va` bool, `Monto` decimal?, `PagoMensualId` int?, `FechaDecision`). Setters privados, constructor gestionado. Índice único `(TitularId, Anio)`. Estado "pendiente" = **no existe fila**.
- **Dominio:** `Titular.GenerarPagoDiciembre(int anio, decimal monto, IReadOnlyCollection<PagoMensual> existentes)`: devuelve el `PagoMensual` mes 12 o lanza si ya existe / monto <= 0. No toca `GenerarPagos`.
- **Application (CQRS, MediatR)** en `Application/Diciembre/`:
  - `GetDiciembreQuery(anio)` → lista de titulares activos con `estado` (pendiente/va/noVa), `montoPactado`, `montoDiciembre`, `totalPagadoDiciembre`.
  - `ConfirmarDiciembreCommand(titularId, anio, va, monto?)`: valida, crea/actualiza `ConfirmacionDiciembre` y el `PagoMensual` en **un solo** `SaveChanges` (atómico).
  - `RevertirDiciembreCommand` o variante de `ConfirmarDiciembreCommand` según la regla de reversibilidad.
  - Validator `ConfirmarDiciembreValidator` (`ValidationException`), `NotFoundException` si no hay titular.
- **Infra:** `IConfirmacionDiciembreRepository` + implementación, `DbSet`, configuración EF, **migración aditiva** (solo `CreateTable` + índice; nada de DROP/ALTER). Registrar en `ServiceCollectionExtensions.cs`.
- **API:** `DiciembreController` (`api/diciembre`): `GET ?anio=`, `PUT titulares/{titularId}` body `{ anio, va, monto }`. DTOs `DiciembreModel.Request/Response` + `*MappingExtensions`. Nunca devolver entidades EF.
- **Front** (`src/reinscripciones/`): tabs "Reinscripciones | Diciembre" en la página (hay patrón en `gastos/components/GastosTabs.tsx`); componentes nuevos `DiciembreTab`, `DiciembreRow` (check va/no va, input monto con `z.coerce.number()` + RHF/Zod si hay formulario), `services/diciembre.api.ts`, `services/diciembre.queries.ts` (TanStack Query, `diciembreKeys`), `types/diciembre.types.ts`. Estados loading/error/empty. Montos con helpers de `shared/utils/number.helpers.ts` / `currency.helpers.ts`. Apellido con `getTitularApellidoDisplay` (fuera de `src/titulares/`). Invalidar `diciembreKeys` y la key de pagos tras mutar. Sin `useMemo`/`useCallback`, sin `var()` en `className`.

## Tareas

- [ ] **T1 Dominio:** `ConfirmacionDiciembre` + `Titular.GenerarPagoDiciembre` + tests (TDD: RED primero). Casos: crea mes 12, monto <= 0 lanza, duplicado lanza, no altera `GenerarPagos` (test existente de mes 3-11 sigue verde).
- [ ] **T2 Infra:** repositorio, `DbSet`, config EF, migración aditiva (revisar el SQL generado; si EF genera algo distinto de CreateTable/CreateIndex, **detenerse**), DI.
- [ ] **T3 Application:** `GetDiciembreQuery`, `ConfirmarDiciembreCommand` (+ validator) con tests de handler (va crea cuota, no va no crea, revertir con pagos rechaza, atomicidad).
- [ ] **T4 API:** `DiciembreController` + DTOs + mapping + test de controller/integración con TestServer.
- [ ] **T5 Front servicios:** types, api, queries, keys + tests de hooks si aplica.
- [ ] **T6 Front UI:** tabs en `ReinscripcionesListPage` + `DiciembreTab`/`DiciembreRow`, precarga de `MontoMensualPactado`, estados loading/error/empty.
- [ ] **T7 Verificación:** `dotnet test` (línea base actual + nuevos), `npm run lint`, `npm run build`, `npx -y react-doctor@latest . --verbose --diff`. Prueba en **api-dev únicamente** (host verificado), jamás prod. Informar ids modificados.
- [ ] **T8 Cierre:** commits convencionales en `development`, sin Co-Authored-By de IA; no mergear a `main` ni desplegar sin orden del dueño. Guardar memoria en Engram.

## Restricciones globales

- Trabajar en branch `development`.
- No cambiar comportamiento observable de endpoints existentes de pagos ni de reinscripciones; sus tests deben pasar sin modificarse.
- Nada hardcodeado (URLs, claves): todo por variables de entorno.
- `git add` solo de archivos de la tarea (hay cambios ajenos sin commitear: `.claude/settings.local.json`, `TransporteWhatsAppBot/`, `promo-*`).
- Riesgo: toca datos de cobro (migración + creación de cuotas). Revisar migración y handlers línea por línea. Consultar al advisor antes de implementar y antes de cerrar.
