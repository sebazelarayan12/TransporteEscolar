namespace TransporteEscolar.Application.MercadoPago;

public sealed record MercadoPagoPaymentInfo(
    long Id,
    string Status,
    string? ExternalReference,
    decimal TransactionAmount,
    DateTime? DateApproved,
    string? CurrencyId);
