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

    public record FilterRequest(
        int Mes,
        int Anio,
        string? Search = null,
        int PageNumber = 1,
        int PageSize = 20);

    public record EstadisticasMes(
        int TotalPagos,
        int CantidadPagados,
        int CantidadPendientes,
        int CantidadVencidos,
        decimal TotalRecaudado,
        decimal TotalPendiente);

    public record Response(
        int Id,
        int TitularId,
        string TitularApellido,
        string TitularNombre,
        string TitularDireccion,
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
