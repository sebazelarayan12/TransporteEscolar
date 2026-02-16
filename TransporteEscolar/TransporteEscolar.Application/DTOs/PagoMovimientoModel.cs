namespace TransporteEscolar.Application.DTOs;

public record PagoMovimientoModel
{
    public record FilterRequest(
        DateOnly? FechaDesde,
        DateOnly? FechaHasta,
        int? TitularId,
        string? MedioPago,
        int PageNumber = 1,
        int PageSize = 20);

    public record Response(
        int Id,
        int PagoMensualId,
        int TitularId,
        string TitularApellido,
        string TitularNombre,
        string TitularNombreCompleto,
        int Mes,
        int Anio,
        string Periodo,
        DateTimeOffset FechaPago,
        decimal Monto,
        string MedioPago,
        string? Observaciones);
}
