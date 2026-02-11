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
        FechaCreacion = DateTime.UtcNow.Date;
    }

    public void Confirmar()
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Solo se puede confirmar una reinscripción pendiente");

        Estado = "Confirmado";
        FechaConfirmacion = DateTime.UtcNow.Date;
    }

    public void MarcarComoNoContinua()
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Solo se puede marcar como no continúa una reinscripción pendiente");

        Estado = "NoContinua";
        FechaConfirmacion = DateTime.UtcNow.Date;
    }

    public void MarcarComoPendiente()
    {
        if (Estado == "Pendiente")
            throw new InvalidOperationException("La reinscripción ya está en estado pendiente");

        Estado = "Pendiente";
        FechaConfirmacion = null;
    }
}