using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IReinscripcionRepository
{
    Task<ReinscripcionPasajero?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ReinscripcionPasajero?> GetByIdConDetallesAsync(int id, CancellationToken cancellationToken = default);
    Task<List<ReinscripcionPasajero>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<ReinscripcionPasajero>> GetByAnioAsync(int anio, CancellationToken cancellationToken = default);
    Task<List<ReinscripcionPasajero>> GetByAnioConDetallesAsync(int anio, CancellationToken cancellationToken = default);
    Task<(List<ReinscripcionPasajero> Reinscripciones, int TotalCount)> GetByAnioConDetallesPaginadoAsync(int anio, int? mes, string? estado, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<bool> ExisteParaPasajeroYAnioAsync(int pasajeroId, int anio, CancellationToken cancellationToken = default);
    Task<ReinscripcionPasajero> AddAsync(ReinscripcionPasajero reinscripcion, CancellationToken cancellationToken = default);
    Task UpdateAsync(ReinscripcionPasajero reinscripcion, CancellationToken cancellationToken = default);
}
