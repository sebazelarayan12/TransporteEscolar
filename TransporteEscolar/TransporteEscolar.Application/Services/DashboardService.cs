using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repository;

    public DashboardService(IDashboardRepository repository)
    {
        _repository = repository;
    }

    public async Task<DashboardModel.Response> ObtenerResumenAsync(
        int mesesHistorico = 6,
        int limiteActividad = 6,
        CancellationToken cancellationToken = default)
    {
        var meses = Math.Max(mesesHistorico, 1);
        var limite = Math.Max(limiteActividad, 1);

        var resumen = await _repository.ObtenerResumenAsync(cancellationToken);

        var fechaInicio = CalcularFechaInicio(meses);
        var recaudacion = await _repository.ObtenerRecaudacionHistoricoAsync(fechaInicio, cancellationToken);
        var recaudacionNormalizada = NormalizarRecaudacion(fechaInicio, meses, recaudacion);

        var actividadReciente = await _repository.ObtenerActividadRecienteAsync(limite, cancellationToken);

        return new DashboardModel.Response(resumen, recaudacionNormalizada, actividadReciente);
    }

    private static DateTime CalcularFechaInicio(int meses)
    {
        var referencia = DateTime.UtcNow.Date;
        var primerDiaMesActual = new DateTime(referencia.Year, referencia.Month, 1);
        return primerDiaMesActual.AddMonths(-(meses - 1));
    }

    private static List<DashboardModel.RevenuePoint> NormalizarRecaudacion(
        DateTime fechaInicio,
        int meses,
        IReadOnlyCollection<DashboardModel.RevenuePoint> datos)
    {
        var mapa = datos.ToDictionary(p => (p.Anio, p.Mes));
        var resultado = new List<DashboardModel.RevenuePoint>(meses);

        for (var i = 0; i < meses; i++)
        {
            var fecha = fechaInicio.AddMonths(i);
            var clave = (fecha.Year, fecha.Month);

            if (mapa.TryGetValue(clave, out var punto))
            {
                var pendiente = Math.Max(punto.TotalPendiente, 0m);
                resultado.Add(new DashboardModel.RevenuePoint(
                    punto.Anio,
                    punto.Mes,
                    punto.TotalGenerado,
                    punto.TotalPagado,
                    pendiente));
            }
            else
            {
                resultado.Add(new DashboardModel.RevenuePoint(
                    fecha.Year,
                    fecha.Month,
                    0m,
                    0m,
                    0m));
            }
        }

        return resultado;
    }
}
