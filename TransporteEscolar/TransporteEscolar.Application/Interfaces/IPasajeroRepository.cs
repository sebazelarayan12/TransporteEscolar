using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IPasajeroRepository
{
    Task<Pasajero?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetActivosAsync(CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetActivosSinHorariosAsync(CancellationToken cancellationToken = default);
    /// <summary>
    /// Lista los pasajeros activos cuyos titulares siguen dados de alta y todavía no tienen una reinscripción creada para el año indicado.
    /// Se utiliza para exponerlos como pendientes dentro de las alertas de pago.
    /// </summary>
    Task<List<Pasajero>> GetActivosDisponiblesParaReinscripcionAsync(int anio, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetActivosPorHorarioAsync(int horarioId, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);
    Task<Dictionary<int, ConteoPorTransporte>> GetActivosCountByHorarioAsync(CancellationToken cancellationToken = default);
    Task<Pasajero> AddAsync(Pasajero pasajero, CancellationToken cancellationToken = default);
    Task UpdateAsync(Pasajero pasajero, CancellationToken cancellationToken = default);
    Task UpdateRangeAsync(IEnumerable<Pasajero> pasajeros, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);
}
