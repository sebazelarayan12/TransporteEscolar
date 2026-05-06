using TransporteEscolar.Application.MercadoPago;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IMercadoPagoService
{
    Task<MercadoPagoLinkResult> GetOrCreatePreferenceAsync(
        PagoMensual pago,
        CancellationToken cancellationToken);

    Task<MercadoPagoPaymentInfo?> GetPaymentAsync(
        long paymentId,
        CancellationToken cancellationToken);
}
