using MediatR;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;


namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record GenerarLinkMercadoPagoCommand(int PagoMensualId) : IRequest<MercadoPagoLinkResponse>;

public sealed record MercadoPagoLinkResponse(string Url, string PreferenceId);

public sealed class GenerarLinkMercadoPagoCommandHandler : IRequestHandler<GenerarLinkMercadoPagoCommand, MercadoPagoLinkResponse>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly IMercadoPagoService _mercadoPagoService;

    public GenerarLinkMercadoPagoCommandHandler(
        IPagoMensualRepository pagoMensualRepository,
        IMercadoPagoService mercadoPagoService)
    {
        _pagoMensualRepository = pagoMensualRepository;
        _mercadoPagoService = mercadoPagoService;
    }

    public async Task<MercadoPagoLinkResponse> Handle(GenerarLinkMercadoPagoCommand request, CancellationToken cancellationToken)
    {
        var pago = await RepositoryHelper.GetByIdOrThrowAsync(
            _pagoMensualRepository.GetByIdAsync,
            request.PagoMensualId,
            nameof(PagoMensual),
            cancellationToken);

        if (pago.EstaPagado())
            throw new ValidationException("El pago mensual ya esta saldado");

        if (!string.IsNullOrWhiteSpace(pago.MercadoPagoUrl) && !string.IsNullOrWhiteSpace(pago.MercadoPagoPreferenceId))
        {
            return new MercadoPagoLinkResponse(pago.MercadoPagoUrl, pago.MercadoPagoPreferenceId);
        }

        var linkResult = await _mercadoPagoService.GetOrCreatePreferenceAsync(pago, cancellationToken);

        pago.AsignarMercadoPagoLink(linkResult.PreferenceId, linkResult.PaymentUrl, DateTime.UtcNow);

        if (linkResult.CreatedNew)
        {
            pago.LimpiarMercadoPagoPayment();
        }

        await _pagoMensualRepository.UpdateAsync(pago, cancellationToken);

        return new MercadoPagoLinkResponse(linkResult.PaymentUrl, linkResult.PreferenceId);
    }
}
