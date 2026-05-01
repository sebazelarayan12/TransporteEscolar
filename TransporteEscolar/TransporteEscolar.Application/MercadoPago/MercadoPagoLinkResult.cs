namespace TransporteEscolar.Application.MercadoPago;

public sealed record MercadoPagoLinkResult(
    string PreferenceId,
    string? InitPoint,
    string? SandboxInitPoint,
    string PaymentUrl,
    bool CreatedNew);
