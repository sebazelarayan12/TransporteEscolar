namespace TransporteEscolar.Domain.Entities;

public class Titular
{
    public int Id { get; private set; }
    public string Apellido { get; private set; } = null!;
    public string NombreContacto { get; private set; } = null!;
    public string Direccion { get; private set; } = null!;
    public decimal MontoMensualPactado { get; private set; }
    public DateTime FechaAlta { get; private set; }
    public DateTime? FechaBaja { get; private set; }

    // Navegación
    public ICollection<TitularTelefono> Telefonos { get; private set; } = null!;

    // Constructor para EF Core
    private Titular() 
    { 
        Telefonos = new List<TitularTelefono>();
    }

    // Constructor para creación
    public Titular(
        string apellido,
        string nombreContacto,
        string direccion,
        decimal montoMensualPactado)
    {
        Apellido = apellido;
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
        FechaAlta = DateTime.UtcNow;
        Telefonos = new List<TitularTelefono>();
    }

    // Métodos simples de actualización
    public void ActualizarDatos(string nombreContacto, string direccion, decimal montoMensualPactado)
    {
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
    }

    public void DarDeBaja()
    {
        FechaBaja = DateTime.UtcNow;
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }
}