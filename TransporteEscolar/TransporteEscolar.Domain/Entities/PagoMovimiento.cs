namespace TransporteEscolar.Domain.Entities;

public class PagoMovimiento
{
    public int Id { get; private set; }
    public int PagoMensualId { get; private set; }
    public decimal Monto { get; private set; }
    public DateTimeOffset FechaPago { get; private set; }
    public string MedioPago { get; private set; } = null!; // "Efectivo", "Transferencia", "Cheque"
    public string? Observaciones { get; private set; }

    // Navegación
    public PagoMensual PagoMensual { get; private set; } = null!;

    // Constructor para EF Core
    private PagoMovimiento() { }

    // Constructor para creación
    public PagoMovimiento(
        int pagoMensualId,
        decimal monto,
        DateTimeOffset fechaPago,
        string medioPago,
        string? observaciones = null)
    {
        PagoMensualId = pagoMensualId;
        Monto = monto;
        FechaPago = fechaPago.ToUniversalTime();
        MedioPago = medioPago;
        Observaciones = observaciones;
    }
}
