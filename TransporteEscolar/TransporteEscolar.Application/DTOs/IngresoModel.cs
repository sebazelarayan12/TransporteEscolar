namespace TransporteEscolar.Application.DTOs;

public record IngresoModel
{
    public record ResumenTotales(
        decimal TotalCuotas,
        decimal TotalIngresosFijos,
        decimal TotalIngresosVariables,
        decimal TotalIngresosExternos,
        decimal TotalGastos,
        decimal GananciaNeta);

    public record ResumenMensualResponse(
        ResumenTotales Totales,
        List<IngresoMensualResponse> IngresosFijos,
        List<IngresoMensualResponse> IngresosVariables);

    public record IngresoMensualResponse(
        int Id,
        int Mes,
        int Anio,
        string Tipo,
        string Categoria,
        string Descripcion,
        decimal Monto,
        DateTime Fecha,
        string MedioCobro,
        string EstadoCobro,
        string? Observaciones,
        int? TemplateId);

    public record IngresoFijoRequest(
        int Mes,
        int Anio,
        string Categoria,
        string Descripcion,
        decimal Monto,
        int DiaDeAplicacion,
        string MedioCobro,
        string? Observaciones);

    public record IngresoVariableRequest(
        int Mes,
        int Anio,
        string Categoria,
        string Descripcion,
        decimal Monto,
        DateOnly Fecha,
        string MedioCobro,
        string EstadoCobro,
        string? Observaciones);
}
