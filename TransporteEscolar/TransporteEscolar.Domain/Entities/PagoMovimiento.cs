namespace TransporteEscolar.Domain.Entities;

public class PagoMovimiento
{
    public int Id { get; private set; }
    public int PagoMensualId { get; private set; }
    public decimal Monto { get; private set; }
    public DateTime FechaPago { get; private set; }
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
        DateTime fechaPago,
        string medioPago,
        string? observaciones = null)
    {
        if (pagoMensualId <= 0)
            throw new ArgumentException("PagoMensualId inválido", nameof(pagoMensualId));
        
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser mayor a 0", nameof(monto));
        
        if (string.IsNullOrWhiteSpace(medioPago))
            throw new ArgumentException("El medio de pago no puede estar vacío", nameof(medioPago));

        PagoMensualId = pagoMensualId;
        Monto = monto;
        FechaPago = fechaPago;
        MedioPago = medioPago;
        Observaciones = observaciones;
    }
}