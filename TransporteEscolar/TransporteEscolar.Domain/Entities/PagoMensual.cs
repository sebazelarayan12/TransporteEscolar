namespace TransporteEscolar.Domain.Entities;

public class PagoMensual
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public int Mes { get; private set; } // 1-12
    public int Anio { get; private set; }
    public decimal MontoGenerado { get; private set; }
    public DateTime FechaVencimiento { get; private set; }
    public string? Observaciones { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;
    public ICollection<PagoMovimiento> Movimientos { get; private set; } = null!;

    // Constructor para EF Core
    private PagoMensual() 
    {
        Movimientos = new List<PagoMovimiento>();
    }

    // Constructor para creación
    public PagoMensual(
        int titularId,
        int mes,
        int anio,
        decimal montoGenerado,
        string? observaciones = null)
    {
        TitularId = titularId;
        Mes = mes;
        Anio = anio;
        MontoGenerado = montoGenerado;
        FechaVencimiento = new DateTime(anio, mes, 10); // Vence día 10 de cada mes
        Observaciones = observaciones;
        Movimientos = new List<PagoMovimiento>();
    }

    public decimal TotalPagado()
    {
        return Movimientos.Sum(m => m.Monto);
    }

    public bool EstaPagado()
    {
        return TotalPagado() >= MontoGenerado;
    }

    public bool EstaVencido()
    {
        return DateTime.UtcNow > FechaVencimiento && !EstaPagado();
    }

    public decimal SaldoPendiente()
    {
        var saldo = MontoGenerado - TotalPagado();
        return saldo > 0 ? saldo : 0;
    }

    public void ActualizarObservaciones(string? observaciones)
    {
        Observaciones = observaciones;
    }
}