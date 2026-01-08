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
        if (pasajeroId <= 0)
            throw new ArgumentException("PasajeroId inválido", nameof(pasajeroId));
        
        if (anio < 2020 || anio > 2100)
            throw new ArgumentException("Año inválido", nameof(anio));

        PasajeroId = pasajeroId;
        Anio = anio;
        Estado = "Pendiente";
        FechaCreacion = DateTime.UtcNow;
    }

    public void Confirmar()
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Solo se puede confirmar una reinscripción pendiente");

        Estado = "Confirmado";
        FechaConfirmacion = DateTime.UtcNow;
    }

    public void MarcarComoNoContinua()
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Solo se puede marcar como no continúa una reinscripción pendiente");

        Estado = "NoContinua";
        FechaConfirmacion = DateTime.UtcNow;
    }
}