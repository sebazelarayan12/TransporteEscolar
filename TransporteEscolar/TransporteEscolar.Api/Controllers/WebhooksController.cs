using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Application.PagosMensuales.Commands;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly ISender _sender;
    private readonly MercadoPagoSettings _mpSettings;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        ISender sender,
        IOptions<MercadoPagoSettings> mpSettings,
        ILogger<WebhooksController> logger)
    {
        _sender = sender;
        _mpSettings = mpSettings.Value;
        _logger = logger;
    }

    [HttpPost("mercadopago")]
    public async Task<IActionResult> ProcesarMercadoPago(
        [FromBody] MercadoPagoWebhookRequest payload,
        CancellationToken cancellationToken)
    {
        if (!ValidarFirma(payload.Data?.Id))
        {
            _logger.LogWarning("Webhook Mercado Pago con firma invalida");
            return Unauthorized();
        }

        if (payload.Data?.Id == null)
        {
            _logger.LogWarning("Webhook Mercado Pago sin data.id");
            return Ok(new { processed = false, reason = "sin_data" });
        }

        if (!long.TryParse(payload.Data.Id, out var paymentId))
        {
            _logger.LogWarning("Webhook Mercado Pago con id invalido {DataId}", payload.Data.Id);
            return Ok(new { processed = false, reason = "id_invalido" });
        }

        _logger.LogInformation(
            "Webhook Mercado Pago recibido {PaymentId} {Topic}/{Type}",
            paymentId,
            payload.Topic,
            payload.Type);

        var result = await _sender.Send(new ProcesarMercadoPagoWebhookCommand(
            paymentId,
            payload.Topic,
            payload.Type,
            payload.Action),
            cancellationToken);

        return Ok(new { processed = result.Processed, reason = result.Reason });
    }

    private bool ValidarFirma(string? dataId)
    {
        var secretKey = _mpSettings.WebhookSecretKey;

        // Si no hay clave configurada, no se valida (permite desarrollo sin firma)
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            _logger.LogWarning("WebhookSecretKey no configurado, saltando validacion de firma");
            return true;
        }

        var xSignature = Request.Headers["x-signature"].FirstOrDefault();
        var xRequestId = Request.Headers["x-request-id"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(xSignature))
        {
            _logger.LogWarning("Webhook sin header x-signature");
            return false;
        }

        // Extraer ts y v1 del header: "ts=<timestamp>,v1=<hash>"
        string? ts = null;
        string? v1 = null;
        foreach (var part in xSignature.Split(','))
        {
            var kv = part.Split('=', 2);
            if (kv.Length != 2) continue;
            if (kv[0].Trim() == "ts") ts = kv[1].Trim();
            if (kv[0].Trim() == "v1") v1 = kv[1].Trim();
        }

        if (ts == null || v1 == null)
        {
            _logger.LogWarning("Webhook x-signature con formato invalido: {Signature}", xSignature);
            return false;
        }

        // Construir el manifest: "id:{dataId};request-id:{xRequestId};ts:{ts};"
        var manifest = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(dataId))
            manifest.Append($"id:{dataId};");
        if (!string.IsNullOrWhiteSpace(xRequestId))
            manifest.Append($"request-id:{xRequestId};");
        manifest.Append($"ts:{ts};");

        // HMAC-SHA256
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var dataBytes = Encoding.UTF8.GetBytes(manifest.ToString());
        var hash = HMACSHA256.HashData(keyBytes, dataBytes);
        var computed = Convert.ToHexString(hash).ToLowerInvariant();

        if (computed != v1)
        {
            _logger.LogWarning("Webhook firma invalida. Esperado: {Computed}", computed);
            return false;
        }

        return true;
    }

    public sealed record MercadoPagoWebhookRequest
    {
        public string? Id { get; init; }
        public string? Type { get; init; }
        public string? Topic { get; init; }
        public string? Action { get; init; }
        public MercadoPagoWebhookData? Data { get; init; }
    }

    public sealed record MercadoPagoWebhookData
    {
        public string? Id { get; init; }
    }
}
