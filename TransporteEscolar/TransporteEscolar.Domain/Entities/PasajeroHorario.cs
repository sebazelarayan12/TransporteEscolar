namespace TransporteEscolar.Domain.Entities;

public class PasajeroHorario
{
    public int Id { get; private set; }
    public int PasajeroId { get; private set; }
    public int HorarioId { get; private set; }
    public bool EsPrincipal { get; private set; }
    public int Prioridad { get; private set; }
    public DateTime FechaAsignacion { get; private set; }

    public Pasajero Pasajero { get; private set; } = null!;
    public Horario Horario { get; private set; } = null!;

    private PasajeroHorario()
    {
    }

    public PasajeroHorario(
        int pasajeroId,
        int horarioId,
        bool esPrincipal,
        int prioridad,
        DateTime? fechaAsignacion = null)
    {
        PasajeroId = pasajeroId;
        HorarioId = horarioId;
        EsPrincipal = esPrincipal;
        Prioridad = prioridad;
        FechaAsignacion = NormalizarFechaUtc(fechaAsignacion ?? DateTime.UtcNow);
    }

    public void DefinirPrincipal(bool esPrincipal)
    {
        EsPrincipal = esPrincipal;
    }

    public void ActualizarPrioridad(int prioridad)
    {
        Prioridad = prioridad;
    }

    public void ActualizarFechaAsignacion(DateTime? fechaAsignacion = null)
    {
        FechaAsignacion = NormalizarFechaUtc(fechaAsignacion ?? DateTime.UtcNow);
    }

    private static DateTime NormalizarFechaUtc(DateTime valor)
    {
        var fechaUtc = valor.Kind switch
        {
            DateTimeKind.Utc => valor,
            DateTimeKind.Local => valor.ToUniversalTime(),
            _ => DateTime.SpecifyKind(valor, DateTimeKind.Utc)
        };

        return DateTime.SpecifyKind(fechaUtc, DateTimeKind.Utc);
    }
}
