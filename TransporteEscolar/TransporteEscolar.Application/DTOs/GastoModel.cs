namespace TransporteEscolar.Application.DTOs;

public record GastoModel
{
    public record ResumenMes(
        decimal TotalCuotas,
        decimal TotalGastosFijos,
        decimal TotalGastosVariables,
        decimal GananciaNeta);

    public record ResumenMensualResponse(
        ResumenMes Totales,
        List<GastoMensualResponse> GastosFijos,
        List<GastoMensualResponse> GastosVariables);

    public record GastoMensualResponse(
        int Id,
        int Mes,
        int Anio,
        string Tipo,
        string Categoria,
        string Descripcion,
        decimal Monto,
        DateTime Fecha,
        string MedioPago,
        string EstadoPago,
        string? Observaciones,
        int? TemplateId);

    public record GastoFijoRequest(
        int Mes,
        int Anio,
        string Categoria,
        string Descripcion,
        decimal Monto,
        int DiaDeAplicacion,
        string MedioPago,
        string? Observaciones);

    public record UpdateGastoFijoRequest(
        int Mes,
        int Anio,
        string Categoria,
        string Descripcion,
        decimal Monto,
        int DiaDeAplicacion,
        string MedioPago,
        string? Observaciones,
        bool EstaActivo);

    public record GastoVariableRequest(
        int Mes,
        int Anio,
        string Categoria,
        string Descripcion,
        decimal Monto,
        DateOnly Fecha,
        string MedioPago,
        string EstadoPago,
        string? Observaciones);
}
