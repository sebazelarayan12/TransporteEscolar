using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Asignación de un pasajero activo a un horario que tiene colegio vinculado.
/// Es la proyección mínima que necesita el cálculo de kilómetros.
/// </summary>
/// <param name="TitularId">Titular dueño del pasajero.</param>
/// <param name="ColegioId">Colegio de destino, tomado del horario.</param>
/// <param name="HorarioId">Horario asignado. Los horarios distintos son viajes distintos.</param>
public sealed record AsignacionColegio(int TitularId, int ColegioId, int HorarioId);

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
    /// <summary>
    /// Igual que GetByTitularIdAsync pero sin filtrar por estado del titular.
    /// Necesario en reactivación de titular: en ese punto el titular todavía figura de baja en BD.
    /// </summary>
    Task<List<Pasajero>> GetTodosByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetActivosPorHorarioAsync(int horarioId, CancellationToken cancellationToken = default);
    Task<List<Pasajero>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);
    Task<Dictionary<int, ConteoPorTransporte>> GetActivosCountByHorarioAsync(CancellationToken cancellationToken = default);
    Task<Pasajero> AddAsync(Pasajero pasajero, CancellationToken cancellationToken = default);
    Task UpdateAsync(Pasajero pasajero, CancellationToken cancellationToken = default);
    Task UpdateRangeAsync(IEnumerable<Pasajero> pasajeros, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Devuelve las asignaciones de pasajeros activos a horarios que tienen colegio vinculado.
    /// </summary>
    /// <param name="titularId">Si se indica, limita el resultado a ese titular. Si es null, devuelve todas.</param>
    Task<List<AsignacionColegio>> GetAsignacionesColegioAsync(
        int? titularId,
        CancellationToken cancellationToken = default);
}
