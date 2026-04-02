using MediatR;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.PagosMensuales.Commands;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly ISender _sender;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(ISender sender, ILogger<WebhooksController> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    [HttpPost("mercadopago")]
    public async Task<IActionResult> ProcesarMercadoPago([FromBody] MercadoPagoWebhookRequest payload, CancellationToken cancellationToken)
    {
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
