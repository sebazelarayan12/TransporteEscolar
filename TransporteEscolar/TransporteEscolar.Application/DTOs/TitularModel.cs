namespace TransporteEscolar.Application.DTOs;

public record TitularModel
{
    public record Request(
        string Apellido,
        string NombreContacto,
        string Direccion,
        decimal MontoMensualPactado,
        DateTime? FechaAlta = null); // Opcional: si no se especifica, usa fecha actual

    public record UpdateRequest(
        string Apellido,
        string NombreContacto,
        string Direccion,
        decimal MontoMensualPactado);

    /// <summary>
    /// Desde qué período se generan las cuotas al reactivar. Si no se especifica,
    /// se usa el mes/año actual.
    /// </summary>
    public record ReactivarRequest(int? MesInicio = null, int? AnioInicio = null);

    public record Response(
        int Id,
        string Apellido,
        string NombreContacto,
        string Direccion,
        decimal MontoMensualPactado,
        DateTime FechaAlta,
        DateTime? FechaBaja,
        bool Activo);

    public record SinTelefonoResponse(
        int Id,
        string Apellido,
        string NombreContacto,
        string Direccion);
}
