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
        if (string.IsNullOrWhiteSpace(apellido))
            throw new ArgumentException("El apellido no puede estar vacío", nameof(apellido));
        
        if (string.IsNullOrWhiteSpace(nombreContacto))
            throw new ArgumentException("El nombre de contacto no puede estar vacío", nameof(nombreContacto));
        
        if (string.IsNullOrWhiteSpace(direccion))
            throw new ArgumentException("La dirección no puede estar vacía", nameof(direccion));
        
        if (montoMensualPactado <= 0)
            throw new ArgumentException("El monto pactado debe ser mayor a 0", nameof(montoMensualPactado));

        Apellido = apellido;
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
        FechaAlta = DateTime.UtcNow;
        Telefonos = new List<TitularTelefono>();
    }

    // Métodos simples de actualización (invariantes)
    public void ActualizarDatos(string nombreContacto, string direccion)
    {
        if (string.IsNullOrWhiteSpace(nombreContacto))
            throw new ArgumentException("El nombre de contacto no puede estar vacío", nameof(nombreContacto));
        
        if (string.IsNullOrWhiteSpace(direccion))
            throw new ArgumentException("La dirección no puede estar vacía", nameof(direccion));

        NombreContacto = nombreContacto;
        Direccion = direccion;
    }

    public void ActualizarMontoPactado(decimal nuevoMonto)
    {
        if (nuevoMonto <= 0)
            throw new ArgumentException("El monto pactado debe ser mayor a 0", nameof(nuevoMonto));

        MontoMensualPactado = nuevoMonto;
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