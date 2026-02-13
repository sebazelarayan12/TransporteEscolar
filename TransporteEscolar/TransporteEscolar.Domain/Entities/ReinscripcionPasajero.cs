namespace TransporteEscolar.Domain.Entities;

public class ReinscripcionPasajero
{
    public int Id { get; private set; }
    public int PasajeroId { get; private set; }
    public int Anio { get; private set; }
    public string Estado { get; private set; } = null!; // "Pendiente", "Confirmado", "NoContinua"
    public DateTime FechaCreacion { get; private set; }
    public DateTime? FechaConfirmacion { get; private set; }

    // Navegación
    public Pasajero Pasajero { get; private set; } = null!;

    // Constructor para EF Core
    private ReinscripcionPasajero() { }

    // Constructor para creación
    public ReinscripcionPasajero(int pasajeroId, int anio)
    {
        PasajeroId = pasajeroId;
        Anio = anio;
        Estado = "Pendiente";
        FechaCreacion = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void Confirmar()
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Solo se puede confirmar una reinscripción pendiente");

        Estado = "Confirmado";
        FechaConfirmacion = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void MarcarComoNoContinua()
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Solo se puede marcar como no continúa una reinscripción pendiente");

        Estado = "NoContinua";
        FechaConfirmacion = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void MarcarComoPendiente()
    {
        if (Estado == "Pendiente")
            throw new InvalidOperationException("La reinscripción ya está en estado pendiente");

        Estado = "Pendiente";
        FechaConfirmacion = null;
    }

    private static DateTime NormalizarFechaUtc(DateTime valor)
    {
        var fechaUtc = valor.Kind switch
        {
            DateTimeKind.Utc => valor,
            DateTimeKind.Local => valor.ToUniversalTime(),
            _ => DateTime.SpecifyKind(valor, DateTimeKind.Utc)
        };

        return DateTime.SpecifyKind(fechaUtc.Date, DateTimeKind.Utc);
    }
}
