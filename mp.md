# Plan Integracion Mercado Pago y Bot WhatsApp

## Objetivo
Implementar generacion de enlaces de pago con Mercado Pago, enviar esos links por el bot actual de WhatsApp y registrar pagos automaticamente via webhook, respetando la arquitectura Domain > Application > Infrastructure > Api y la regla global sin tildes.

## Alcance
1. Persistir identificadores de Mercado Pago en `PagoMensual` para evitar regeneraciones y vincular pagos entrantes.
2. Crear servicio de aplicacion que usa el SDK oficial para generar preferencias y reutilizarlas cuando existan.
3. Publicar endpoint POST para solicitar el link de una cuota desde el bot y otro endpoint POST `/api/webhooks/mercadopago` para recibir notificaciones.
4. Ajustar el bot (Node) para invocar el nuevo endpoint al momento de enviar mensajes.
5. Configurar usuarios sandbox y variables en Railway para pruebas.

## Definiciones clave
- `external_reference` de la preferencia sera igual al `PagoMensualId`, de modo que el webhook pueda identificar la cuota consultando `/v1/payments/{id}`.
- Un link no vence por tiempo; se reutiliza hasta que el pago este registrado como aprobado. Si el monto de la cuota cambia se debera generar una nueva preferencia y guardar los nuevos metadatos.
- Solo se aceptan pagos con tarjeta o dinero en cuenta (se excluyen payment types `ticket` y `atm`).
- Se registrara la cuota cuando el webhook confirme `status == approved`.

## Cambios por capas
### Dominio / Persistencia
- `TransporteEscolar.Domain/Entities/PagoMensual.cs`
  - Agregar `public string? MercadoPagoPreferenceId { get; set; }`
  - Agregar `public string? MercadoPagoUrl { get; set; }`
  - Agregar `public string? MercadoPagoPaymentId { get; set; }` (ultimo pago aprobado).
  - Opcional: `public DateTime? MercadoPagoGeneratedAt { get; set; }` para auditoria (puede omitirse si no se necesita registro temporal).
- `TransporteEscolar.Infrastructure/Persistence/AppDbContext.cs`
  - Actualizar configuracion del entity y crear migracion (ej. `add mp_fields_pagomensual`).
  - Considerar indice unico sobre `MercadoPagoPreferenceId` para responder rapido en el webhook.

### Application Layer
- Instalar `MercadoPago.SDK` en el proyecto Application.
- `Interfaces/IMercadoPagoService.cs`
  - Metodo `Task<MercadoPagoLinkResult> GetOrCreatePreferenceAsync(PagoMensual pago, Titular titular, CancellationToken ct)`.
  - DTO `MercadoPagoLinkResult` contiene `PreferenceId`, `InitPoint`, `SandboxInitPoint` y `PaymentUrl` (usar uno u otro segun entorno).
- `Services/MercadoPagoService.cs`
  - Inyectar `IOptions<MercadoPagoSettings>` (AccessTokenSandbox, AccessTokenProd, WebhookBaseUrl, UseSandbox).
  - Configurar `MercadoPagoConfig.AccessToken` segun entorno.
  - Construir `PreferenceRequest` con:
    - `items` (titulo “Cuota {mes/año} - {TitularNombre}”, cantidad 1, unit_price = monto adeudado).
    - `payer` con datos minimos del titular (email/telefono si existe).
    - `external_reference = pago.Id.ToString()`.
    - `notification_url = $"{WebhookBaseUrl}/api/webhooks/mercadopago"`.
    - `excluded_payment_types = [ ticket, atm ]` y `auto_return = approved`.
  - Retornar la preferencia y no recrearla si `pago.MercadoPagoPreferenceId` indica una existente.
- `PagosMensuales/Commands/GenerarLinkMercadoPagoCommand` + handler
  - Input: `PagoMensualId`.
  - Flujo: obtener pago + titular -> si `MercadoPagoUrl` existe devuelve directamente -> sino generar preferencia -> guardar `PreferenceId`, `MercadoPagoUrl` y `MercadoPagoPaymentId = null` -> retornar URL.
  - Exponer DTO de respuesta con `url` y metadata.
- Actualizar `RegisterServices` para agregar `IMercadoPagoService` y command handler.

### API Layer
- `PagosController`
  - `POST /api/pagos/{id}/mercadopago-link`
  - Usa `GenerarLinkMercadoPagoCommand` y responde `{ url: string }`.
  - Autenticacion igual que el resto de endpoints del bot (si la hay) y logs minimos.
- `WebhooksController`
  - `POST /api/webhooks/mercadopago`
  - Recibe `topic`/`type` y `data.id`. Validar header `X-Signature` si se configura, sino proceder directo.
  - Pasos:
    1. Registrar log de recepcion (sin datos sensibles).
    2. Llamar `GET https://api.mercadopago.com/v1/payments/{id}` con access token.
    3. Confirmar `status == approved`.
    4. Leer `external_reference` y convertir a `PagoMensualId`.
    5. Si ya existe `MercadoPagoPaymentId == id`, retornar 200 (idempotente).
    6. Caso contrario, invocar `RegistrarPagoCommand` con datos del pago (monto acreditado, fecha, medio `MercadoPago`).
    7. Actualizar `MercadoPagoPaymentId` en la entidad y guardar.
  - Responder siempre rapido (200) para evitar reintentos; en caso de error critico loggear y retornar 500 para que Mercado Pago reintente.

### Bot WhatsApp (Node)
- Archivo `TransporteWhatsAppBot/index.js` (o equivalente):
  - En `fetchDestinatariosPendientes`, al iterar cada pago pendiente llamar `POST /api/pagos/{pagoId}/mercadopago-link`.
  - Guardar la URL y embedirla en `buildMensajePendientes` (ej: "Link seguro: ${url}").
  - Mantener modo manual (script por consola) y registrar en logs que el link se obtuvo correctamente.

## Configuracion y secretos
- Variables en Railway / appsettings:
  - `MercadoPago:UseSandbox=true` (hasta deploy final).
  - `MercadoPago:AccessTokenSandbox=...`
  - `MercadoPago:AccessTokenProd=...` (vacante hasta produccion).
  - `MercadoPago:WebhookBaseUrl=https://<app>.railway.app`.
- Usuario vendedor sandbox provee Access Token, usuario comprador sandbox para probar tarjetas.
- Para desarrollo local se puede mantener Railway como endpoint publico; si se ejecuta local y se necesita webhook se habilitara ngrok temporal.

## Plan de pruebas manuales
1. Levantar Docker SQL (`docker-compose -f docker-compose.testing.yml up -d`) y backend en Testing.
2. Configurar access token sandbox en appsettings locales o variables de entorno.
3. Ejecutar `POST /api/pagos/{id}/mercadopago-link` (via Swagger) y confirmar que se crea `MercadoPagoPreferenceId` y `MercadoPagoUrl`.
4. Correr bot en modo simulacion (dryRun) para verificar que los mensajes incluyen el link.
5. Usar el comprador sandbox para abrir el link, completar pago y confirmar redireccion.
6. Verificar logs del backend para asegurar que el webhook se recibio y que `PagoMensual` quedo marcado como pagado con `MercadoPagoPaymentId`.
7. Repetir el pago (desde webhook) para validar idempotencia (segunda notificacion debe ignorarse mas alla del 200).

## Riesgos y mitigaciones
- **Falla de webhook**: agregar logs estructurados y posibilidad de reejecutar `RegistrarPago` manual usando `MercadoPagoPaymentId`.
- **Tokens invalidos**: asegurar manejo de excepciones en `MercadoPagoService`, retornando mensaje claro al comando/bot.
- **Bot sin conexion**: si el bot falla, el endpoint permite que un admin copie manualmente el link desde Swagger/UI.
- **Cambios de monto**: documentar que si se modifica el valor de una cuota ya generada, se debe borrar `MercadoPagoPreferenceId` para forzar nueva preferencia.

## Estados pendientes
- Implementar migracion EF al momento de desarrollar.
- Definir politica de logs (Serilog/Splunk) para eventos de Mercado Pago.
- Evaluar mas adelante automatizar el bot (scheduler) si el flujo manual se vuelve insuficiente.
