using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface ITitularRepository
{
    Task<Titular?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Titular>> GetByIdsAsync(List<int> ids, CancellationToken cancellationToken = default);
    Task<List<Titular>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Titular>> GetActivosAsync(CancellationToken cancellationToken = default);
    Task<List<Titular>> GetSinTelefonosActivosAsync(CancellationToken cancellationToken = default);
    Task<Titular> AddAsync(Titular titular, CancellationToken cancellationToken = default);
    Task UpdateAsync(Titular titular, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);
}
