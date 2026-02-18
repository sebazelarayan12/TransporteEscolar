# Sincronización Frontend – Transporte por Horario

Actualización del 18/02/2026 para exponer el transporte (1 o 2) en todos los contratos relacionados con horarios.

## Nuevos campos en las respuestas

- `GET /api/horarios`
  - El DTO `HorarioModel.Response` suma `conteosPorTransporte: { transporteUno, transporteDos }` además del `pasajerosActivos` total.
- `GET /api/horarios/{id}/pasajeros`
  - `pasajerosAsignados.conteosPorTransporte` refleja la cantidad de pasajeros por transporte.
  - Cada elemento `pasajerosAsignados.pasajeros[]` expone `transporte` junto al resto de metadatos.
- `GET /api/pasajeros` y derivados
  - Dentro de `horariosAsignados[]` (PasajeroModel.Response) ahora viene `transporte` por cada asignación.

## Nuevos campos en las mutaciones

- `PUT /api/horarios/{id}/asignaciones`
  - Cada objeto `pasajeros[]` acepta `transporte` (1|2). Para el atajo `pasajeroIds[]` usar el nuevo campo raíz `transporte` para aplicar a todos.
- `POST /api/pasajeros/{id}/horarios`
  - El body `PasajeroHorarioModel.AsignacionRequest` acepta `transporte` (1|2). Si se reenvía una asignación existente se actualiza el transporte.

Si el frontend no envía `transporte`, siempre se asumirá `1` para mantener compatibilidad.
