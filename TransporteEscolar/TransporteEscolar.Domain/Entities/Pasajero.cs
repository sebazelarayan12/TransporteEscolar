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
    public ICollection<ReinscripcionPasajero> Reinscripciones { get; private set; } = null!;

    // Constructor para EF Core
    private Pasajero() 
    {
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
        FechaAlta = fechaAlta?.Date ?? DateTime.UtcNow.Date;
        Reinscripciones = new List<ReinscripcionPasajero>();
    }

    public void ActualizarDatos(
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones)
    {
        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
    }

    public void DarDeBaja()
    {
        FechaBaja = DateTime.UtcNow.Date;
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }

    public string NombreCompleto() => $"{Nombre} {Titular.Apellido}";
}