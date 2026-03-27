using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class PagoMensualMappingExtensions
{
    public static PagoMensualModel.Response ToResponse(this PagoMensual pagoMensual)
    {
        var movimientos = pagoMensual.Movimientos
            .OrderBy(m => m.FechaPago)
            .Select(m => m.ToPagoMensualMovimientoResponse())
            .ToList();

        return new PagoMensualModel.Response(
            pagoMensual.Id,
            pagoMensual.TitularId,
            pagoMensual.Titular?.Apellido ?? string.Empty,
            pagoMensual.Titular?.NombreContacto ?? string.Empty,
            pagoMensual.Titular?.Direccion ?? string.Empty,
            pagoMensual.Mes,
            pagoMensual.Anio,
            pagoMensual.ToPeriodo(),
            pagoMensual.MontoGenerado,
            pagoMensual.TotalPagado(),
            pagoMensual.SaldoPendiente(),
            pagoMensual.FechaVencimiento,
            pagoMensual.EstaPagado(),
            pagoMensual.EstaVencido(),
            pagoMensual.Observaciones,
            movimientos);
    }

    public static List<PagoMensualModel.Response> ToResponseList(this IEnumerable<PagoMensual> pagos)
        => pagos.Select(ToResponse).ToList();

    public static string ToPeriodo(this PagoMensual pagoMensual) => BuildPeriodo(pagoMensual.Mes, pagoMensual.Anio);

    public static string BuildPeriodo(int mes, int anio) => $"{mes:D2}/{anio}";
}
