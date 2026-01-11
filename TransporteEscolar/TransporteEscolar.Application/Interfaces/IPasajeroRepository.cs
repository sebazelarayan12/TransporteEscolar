using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IPasajeroRepository
{
    Task<Pasajero?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetActivosAsync(CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);
    Task<Pasajero> AddAsync(Pasajero pasajero, CancellationToken cancellationToken = default);
    Task UpdateAsync(Pasajero pasajero, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);
}
