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
        var limite = Math.Max(limiteActividad, 1);

        var resumen = await _repository.ObtenerResumenAsync(cancellationToken);

        // Calcular ciclo lectivo (marzo-diciembre del año actual)
        var anioActual = DateTime.UtcNow.Year;
        var fechaInicio = new DateTime(anioActual, 3, 1); // Marzo del año actual

        var recaudacion = await _repository.ObtenerRecaudacionHistoricoAsync(fechaInicio, cancellationToken);
        var recaudacionNormalizada = NormalizarRecaudacionCicloLectivo(anioActual, recaudacion);

        var actividadReciente = await _repository.ObtenerActividadRecienteAsync(limite, cancellationToken);

        return new DashboardModel.Response(resumen, recaudacionNormalizada, actividadReciente);
    }

    private static List<DashboardModel.RevenuePoint> NormalizarRecaudacionCicloLectivo(
        int anioActual,
        IReadOnlyCollection<DashboardModel.RevenuePoint> datos)
    {
        var mapa = datos.ToDictionary(p => (p.Anio, p.Mes));
        var resultado = new List<DashboardModel.RevenuePoint>(10);

        // Recorrer meses 3 (marzo) a 12 (diciembre)
        for (var mes = 3; mes <= 12; mes++)
        {
            var clave = (anioActual, mes);

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
                    anioActual,
                    mes,
                    0m,
                    0m,
                    0m));
            }
        }

        return resultado;
    }
}
