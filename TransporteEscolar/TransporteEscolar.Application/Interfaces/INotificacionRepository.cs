using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface INotificacionRepository
{
    Task<Notificacion?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Notificacion>> GetPaginadasAsync(int pageNumber, int pageSize, bool soloNoLeidas, CancellationToken cancellationToken = default);
    Task<int> GetCountNoLeidasAsync(CancellationToken cancellationToken = default);
    Task<Notificacion> AddAsync(Notificacion notificacion, CancellationToken cancellationToken = default);
    Task UpdateAsync(Notificacion notificacion, CancellationToken cancellationToken = default);
    Task MarcarTodasComoLeidasAsync(CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<int> LimpiarAntiguasAsync(CancellationToken cancellationToken = default);
}
