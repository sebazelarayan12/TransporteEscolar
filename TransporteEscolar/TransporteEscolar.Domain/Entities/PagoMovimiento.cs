namespace TransporteEscolar.Domain.Entities;

public class PagoMovimiento
{
    public int Id { get; private set; }
    public int PagoMensualId { get; private set; }
    public decimal Monto { get; private set; }
    public DateTimeOffset FechaPago { get; private set; }
    public string MedioPago { get; private set; } = null!; // "Efectivo" o "Transferencia"
    public string? Observaciones { get; private set; }

    /// <summary>Plazo (en horas) durante el cual el bot puede anular un pago que cargó.</summary>
    public const int HorasParaAnularPorBot = 24;

    /// <summary>Hash SHA-256 del id del mensaje de WhatsApp que originó el pago. Null si no lo cargó el bot.</summary>
    public string? OrigenMensajeId { get; private set; }

    /// <summary>Identificador opaco que agrupa los movimientos de un mismo pago del bot (reparto en varias cuotas).</summary>
    public Guid? GrupoId { get; private set; }

    /// <summary>Momento de creación (UTC). Solo se completa en los movimientos cargados por el bot.</summary>
    public DateTime? FechaCreacion { get; private set; }

    public bool EsDeBot => OrigenMensajeId is not null;

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

    /// <summary>
    /// Marca el movimiento como cargado por el bot de WhatsApp.
    /// </summary>
    /// <param name="origenMensajeId">Hash del id del mensaje de origen.</param>
    /// <param name="grupoId">Id del grupo al que pertenece el movimiento (un pago puede repartirse en varias cuotas).</param>
    /// <param name="ahoraUtc">Momento de creación.</param>
    public void MarcarComoCargadoPorBot(string origenMensajeId, Guid grupoId, DateTime ahoraUtc)
    {
        if (string.IsNullOrWhiteSpace(origenMensajeId))
        {
            throw new ArgumentException("El id del mensaje de origen es obligatorio.", nameof(origenMensajeId));
        }

        if (grupoId == Guid.Empty)
        {
            throw new ArgumentException("El id del grupo es obligatorio.", nameof(grupoId));
        }

        OrigenMensajeId = origenMensajeId;
        GrupoId = grupoId;
        FechaCreacion = DateTime.SpecifyKind(ahoraUtc, DateTimeKind.Utc);
    }

    /// <summary>
    /// Indica si el movimiento todavía puede anularse por el bot (menos de <see cref="HorasParaAnularPorBot"/> horas desde su creación).
    /// </summary>
    public bool DentroDelPlazoDeAnulacion(DateTime ahoraUtc)
    {
        return FechaCreacion.HasValue
            && ahoraUtc - FechaCreacion.Value < TimeSpan.FromHours(HorasParaAnularPorBot);
    }
}
