using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardModel.Response> ObtenerResumenAsync(int mesesHistorico = 6, int limiteActividad = 6, CancellationToken cancellationToken = default);
}
