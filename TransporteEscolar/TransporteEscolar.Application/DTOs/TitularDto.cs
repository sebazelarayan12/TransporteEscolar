namespace TransporteEscolar.Application.DTOs;

public record TitularDto
{
    public int Id { get; init; }
    public string Apellido { get; init; } = null!;
    public string NombreContacto { get; init; } = null!;
    public string Direccion { get; init; } = null!;
    public decimal MontoMensualPactado { get; init; }
    public DateTime FechaAlta { get; init; }
    public DateTime? FechaBaja { get; init; }
    public bool Activo => FechaBaja == null;
}

public record CrearTitularDto
{
    public string Apellido { get; init; } = null!;
    public string NombreContacto { get; init; } = null!;
    public string Direccion { get; init; } = null!;
    public decimal MontoMensualPactado { get; init; }
}

public record ActualizarTitularDto
{
    public string NombreContacto { get; init; } = null!;
    public string Direccion { get; init; } = null!;
    public decimal MontoMensualPactado { get; init; }
}
