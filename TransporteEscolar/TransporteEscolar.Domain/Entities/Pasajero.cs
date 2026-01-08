namespace TransporteEscolar.Domain.Entities;

public class Pasajero
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public string Nombre { get; private set; } = null!;
    public string Apellido { get; private set; } = null!;
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
        string apellido,
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones = null)
    {
        if (titularId <= 0)
            throw new ArgumentException("TitularId inválido", nameof(titularId));
        
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre no puede estar vacío", nameof(nombre));
        
        if (string.IsNullOrWhiteSpace(apellido))
            throw new ArgumentException("El apellido no puede estar vacío", nameof(apellido));
        
        if (string.IsNullOrWhiteSpace(colegio))
            throw new ArgumentException("El colegio no puede estar vacío", nameof(colegio));
        
        if (string.IsNullOrWhiteSpace(gradoCurso))
            throw new ArgumentException("El grado/curso no puede estar vacío", nameof(gradoCurso));
        
        if (string.IsNullOrWhiteSpace(turno))
            throw new ArgumentException("El turno no puede estar vacío", nameof(turno));

        TitularId = titularId;
        Nombre = nombre;
        Apellido = apellido;
        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
        FechaAlta = DateTime.UtcNow;
        Reinscripciones = new List<ReinscripcionPasajero>();
    }

    public void ActualizarDatos(
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones)
    {
        if (string.IsNullOrWhiteSpace(colegio))
            throw new ArgumentException("El colegio no puede estar vacío", nameof(colegio));
        
        if (string.IsNullOrWhiteSpace(gradoCurso))
            throw new ArgumentException("El grado/curso no puede estar vacío", nameof(gradoCurso));
        
        if (string.IsNullOrWhiteSpace(turno))
            throw new ArgumentException("El turno no puede estar vacío", nameof(turno));

        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
    }

    public void DarDeBaja()
    {
        FechaBaja = DateTime.UtcNow;
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }

    public string NombreCompleto() => $"{Nombre} {Apellido}";
}