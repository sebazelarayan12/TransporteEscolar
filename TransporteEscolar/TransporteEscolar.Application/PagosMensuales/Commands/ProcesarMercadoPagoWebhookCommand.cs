using System.Globalization;
using MediatR;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.MercadoPago;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record ProcesarMercadoPagoWebhookCommand(
    long PaymentId,
    string? Topic,
    string? Type,
    string? Action) : IRequest<MercadoPagoWebhookResult>;

public sealed record MercadoPagoWebhookResult(bool Processed, string? Reason);

public sealed class ProcesarMercadoPagoWebhookCommandHandler : IRequestHandler<ProcesarMercadoPagoWebhookCommand, MercadoPagoWebhookResult>
{
    private readonly IMercadoPagoService _mercadoPagoService;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly ISender _sender;
    private readonly ILogger<ProcesarMercadoPagoWebhookCommandHandler> _logger;

    public ProcesarMercadoPagoWebhookCommandHandler(
        IMercadoPagoService mercadoPagoService,
        IPagoMensualRepository pagoMensualRepository,
        ISender sender,
        ILogger<ProcesarMercadoPagoWebhookCommandHandler> logger)
    {
        _mercadoPagoService = mercadoPagoService;
        _pagoMensualRepository = pagoMensualRepository;
        _sender = sender;
        _logger = logger;
    }

    public async Task<MercadoPagoWebhookResult> Handle(ProcesarMercadoPagoWebhookCommand request, CancellationToken cancellationToken)
    {
        MercadoPagoPaymentInfo? paymentInfo;
        try
        {
            paymentInfo = await _mercadoPagoService.GetPaymentAsync(request.PaymentId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consultando pago Mercado Pago {PaymentId}", request.PaymentId);
            return new MercadoPagoWebhookResult(false, "error_consultando_pago");
        }

        if (paymentInfo == null)
        {
            _logger.LogWarning("Pago Mercado Pago {PaymentId} no encontrado", request.PaymentId);
            return new MercadoPagoWebhookResult(false, "pago_no_encontrado");
        }

        if (!string.Equals(paymentInfo.Status, "approved", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation(
                "Pago Mercado Pago {PaymentId} con estado {Status} ignorado",
                request.PaymentId,
                paymentInfo.Status);
            return new MercadoPagoWebhookResult(false, "estado_no_aprobado");
        }

        if (!int.TryParse(paymentInfo.ExternalReference, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pagoMensualId))
        {
            _logger.LogWarning(
                "External reference {Reference} no corresponde a un pago mensual",
                paymentInfo.ExternalReference);
            return new MercadoPagoWebhookResult(false, "external_reference_invalida");
        }

        var pago = await _pagoMensualRepository.GetByIdAsync(pagoMensualId, cancellationToken);
        if (pago == null)
        {
            _logger.LogWarning(
                "Pago mensual {PagoMensualId} no encontrado para webhook Mercado Pago {PaymentId}",
                pagoMensualId,
                request.PaymentId);
            return new MercadoPagoWebhookResult(false, "pago_mensual_no_encontrado");
        }

        var paymentIdAsString = paymentInfo.Id.ToString(CultureInfo.InvariantCulture);
        if (!string.IsNullOrWhiteSpace(pago.MercadoPagoPaymentId) && pago.MercadoPagoPaymentId == paymentIdAsString)
        {
            _logger.LogInformation(
                "Webhook idempotente para pago mensual {PagoMensualId} y pago {PaymentId}",
                pagoMensualId,
                request.PaymentId);
            return new MercadoPagoWebhookResult(false, "pago_ya_procesado");
        }

        var fechaPago = paymentInfo.DateApproved.HasValue
            ? DateTime.SpecifyKind(paymentInfo.DateApproved.Value, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var registrarPagoRequest = new PagoMensualModel.RegistrarPagoRequest(
            paymentInfo.TransactionAmount,
            new DateTimeOffset(fechaPago),
            "MercadoPago",
            $"Pago acreditado Mercado Pago {paymentInfo.Id}");

        await _sender.Send(new RegistrarPagoCommand(pagoMensualId, registrarPagoRequest), cancellationToken);

        pago.RegistrarMercadoPagoPayment(paymentIdAsString);
        await _pagoMensualRepository.UpdateAsync(pago, cancellationToken);

        _logger.LogInformation(
            "Pago mensual {PagoMensualId} actualizado por webhook Mercado Pago {PaymentId} ({Topic}/{Type})",
            pagoMensualId,
            request.PaymentId,
            request.Topic,
            request.Type);

        return new MercadoPagoWebhookResult(true, null);
    }
}
