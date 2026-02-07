using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IDashboardRepository
{
    Task<DashboardModel.Summary> ObtenerResumenAsync(CancellationToken cancellationToken = default);
    Task<List<DashboardModel.RevenuePoint>> ObtenerRecaudacionHistoricoAsync(DateTime fechaInicio, CancellationToken cancellationToken = default);
    Task<List<DashboardModel.ActivityItem>> ObtenerActividadRecienteAsync(int limite, CancellationToken cancellationToken = default);
}
