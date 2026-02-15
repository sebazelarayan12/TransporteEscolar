using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IPasajeroHorarioRepository
{
    Task<PasajeroHorario?> GetAsync(int pasajeroId, int horarioId, CancellationToken cancellationToken = default);
    Task<List<PasajeroHorario>> GetByPasajeroIdAsync(int pasajeroId, CancellationToken cancellationToken = default);
    Task<List<PasajeroHorario>> GetByPasajeroIdsAsync(IEnumerable<int> pasajeroIds, CancellationToken cancellationToken = default);
    Task<PasajeroHorario> AddAsync(PasajeroHorario asignacion, CancellationToken cancellationToken = default);
    Task UpdateAsync(PasajeroHorario asignacion, CancellationToken cancellationToken = default);
    Task UpdateRangeAsync(IEnumerable<PasajeroHorario> asignaciones, CancellationToken cancellationToken = default);
    Task RemoveAsync(PasajeroHorario asignacion, CancellationToken cancellationToken = default);
    Task<int> ObtenerSiguientePrioridadAsync(int pasajeroId, CancellationToken cancellationToken = default);
    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default);
}
