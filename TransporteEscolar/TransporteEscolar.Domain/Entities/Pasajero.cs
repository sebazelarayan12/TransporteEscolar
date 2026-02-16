namespace TransporteEscolar.Domain.Entities;

public class Pasajero
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public string Nombre { get; private set; } = null!;
    public string Colegio { get; private set; } = null!;
    public string GradoCurso { get; private set; } = null!;
    public string Turno { get; private set; } = null!;
    public string? Observaciones { get; private set; }
    public DateTime FechaAlta { get; private set; }
    public DateTime? FechaBaja { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;
    public ICollection<PasajeroHorario> PasajeroHorarios { get; private set; } = null!;
    public ICollection<ReinscripcionPasajero> Reinscripciones { get; private set; } = null!;

    // Constructor para EF Core
    private Pasajero()
    {
        PasajeroHorarios = new List<PasajeroHorario>();
        Reinscripciones = new List<ReinscripcionPasajero>();
    }

    // Constructor para creación
    public Pasajero(
        int titularId,
        string nombre,
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones = null,
        DateTime? fechaAlta = null)
    {
        TitularId = titularId;
        Nombre = nombre;
        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
        var referencia = fechaAlta ?? DateTime.UtcNow;
        FechaAlta = NormalizarFechaUtc(referencia);
        PasajeroHorarios = new List<PasajeroHorario>();
        Reinscripciones = new List<ReinscripcionPasajero>();
    }

    public void ActualizarDatos(
        string nombre,
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones)
    {
        Nombre = nombre;
        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
    }

    public void DarDeBaja()
    {
        FechaBaja = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }

    public string NombreCompleto() => $"{Nombre} {Titular.Apellido}";

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
