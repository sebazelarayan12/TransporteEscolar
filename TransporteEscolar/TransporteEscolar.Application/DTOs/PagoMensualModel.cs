namespace TransporteEscolar.Application.DTOs;

public record PagoMensualModel
{
    public record Request(
        int TitularId,
        int Mes,
        int Anio,
        decimal MontoGenerado,
        string? Observaciones);

    public record RegistrarPagoRequest(
        decimal Monto,
        DateTime FechaPago,
        string MedioPago,
        string? Observaciones);

    public record UpdateObservacionesRequest(string? Observaciones);

    public record Response(
        int Id,
        int TitularId,
        string TitularApellido,
        int Mes,
        int Anio,
        string Periodo,
        decimal MontoGenerado,
        decimal TotalPagado,
        decimal SaldoPendiente,
        DateTime FechaVencimiento,
        bool EstaPagado,
        bool EstaVencido,
        string? Observaciones,
        List<MovimientoResponse> Movimientos);

    public record MovimientoResponse(
        int Id,
        decimal Monto,
        DateTime FechaPago,
        string MedioPago,
        string? Observaciones);
}
