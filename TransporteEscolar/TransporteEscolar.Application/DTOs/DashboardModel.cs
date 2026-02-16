namespace TransporteEscolar.Application.DTOs;

public record DashboardModel
{
    public record Summary(
        decimal TotalPendiente,
        int CantidadPendiente,
        decimal TotalVencido,
        int CantidadVencido,
        int TitularesActivos,
        int PasajerosActivos);

    public record RevenuePoint(
        int Anio,
        int Mes,
        decimal TotalGenerado,
        decimal TotalPagado,
        decimal TotalPendiente);

    public record ActivityItem(
        int MovimientoId,
        int TitularId,
        string TitularNombre,
        string TitularApellido,
        string Periodo,
        decimal Monto,
        DateTimeOffset FechaPago,
        string MedioPago,
        decimal SaldoPendiente);

    public record Response(
        Summary Summary,
        List<RevenuePoint> Recaudacion,
        List<ActivityItem> ActividadReciente);
}
