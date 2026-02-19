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
        decimal montoMensualPactado,
        DateTime? fechaAlta = null)
    {
        Apellido = NormalizarApellido(apellido);
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
        var referencia = fechaAlta ?? DateTime.UtcNow;
        FechaAlta = NormalizarFechaUtc(referencia);
        Telefonos = new List<TitularTelefono>();
    }

    // Métodos simples de actualización
    public void ActualizarDatos(string apellido, string nombreContacto, string direccion, decimal montoMensualPactado)
    {
        Apellido = NormalizarApellido(apellido);
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
    }

    public void ActualizarMontoMensual(decimal nuevoMonto)
    {
        if (nuevoMonto <= 0)
            throw new ArgumentOutOfRangeException(nameof(nuevoMonto), "El monto mensual pactado debe ser mayor a 0");

        MontoMensualPactado = nuevoMonto;
    }

    public void DarDeBaja()
    {
        FechaBaja = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void Reactivar()
    {
        FechaBaja = null;
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

    private static string NormalizarApellido(string valor)
    {
        return valor.Trim().ToUpperInvariant();
    }
}
