using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Recibe los eventos de estado de mensajes (webhooks) enviados por Meta.
/// Endpoint público — Meta lo llama directamente sin autenticación Bearer.
/// La seguridad se garantiza por el "Verify Token" secreto en el GET de verificación.
/// </summary>
[ApiController]
[Route("api/whatsapp/webhook")]
public class WhatsAppWebhookController : ControllerBase
{
    private readonly IWhatsAppLoteService _loteService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WhatsAppWebhookController> _logger;

    public WhatsAppWebhookController(
        IWhatsAppLoteService loteService,
        IConfiguration configuration,
        ILogger<WhatsAppWebhookController> logger)
    {
        _loteService = loteService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Desafío de verificación de webhook. Meta lo llama al configurar la URL del webhook en Business Manager.
    /// </summary>
    [HttpGet]
    public IActionResult VerificarWebhook(
        [FromQuery(Name = "hub.mode")] string mode,
        [FromQuery(Name = "hub.challenge")] string challenge,
        [FromQuery(Name = "hub.verify_token")] string verifyToken)
    {
        var tokenEsperado = _configuration["MetaWhatsApp:WebhookVerifyToken"];

        if (mode == "subscribe" && verifyToken == tokenEsperado)
        {
            _logger.LogInformation("Webhook de Meta verificado correctamente");
            return Ok(challenge);  // Meta verifica que respondemos con el challenge exacto
        }

        _logger.LogWarning("Intento de verificación de webhook rechazado. Token inválido.");
        return Forbid();
    }

    /// <summary>
    /// Recibe eventos de estado de mensajes (sent, delivered, read, failed).
    /// Meta envía un array de "statuses" en el body JSON.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> RecibirEvento(CancellationToken cancellationToken)
    {
        string body;
        using (var reader = new StreamReader(Request.Body))
            body = await reader.ReadToEndAsync(cancellationToken);

        _logger.LogDebug("Webhook WhatsApp recibido: {Body}", body);

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            // La estructura del payload de Meta: entry[].changes[].value.statuses[]
            if (!root.TryGetProperty("entry", out var entries)) return Ok();

            foreach (var entry in entries.EnumerateArray())
            {
                if (!entry.TryGetProperty("changes", out var changes)) continue;

                foreach (var change in changes.EnumerateArray())
                {
                    if (!change.TryGetProperty("value", out var value)) continue;
                    if (!value.TryGetProperty("statuses", out var statuses)) continue;

                    foreach (var status in statuses.EnumerateArray())
                    {
                        var messageId  = status.GetProperty("id").GetString() ?? string.Empty;
                        var nuevoEstado = status.GetProperty("status").GetString() ?? string.Empty;

                        if (!string.IsNullOrEmpty(messageId))
                        {
                            await _loteService.ProcesarWebhookStatusAsync(
                                messageId, nuevoEstado, cancellationToken);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // Siempre retornar 200 a Meta: si respondemos 4xx/5xx, reintenta el evento
            _logger.LogError(ex, "Error procesando payload de webhook de Meta");
        }

        return Ok();
    }
}
