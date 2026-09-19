using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Acceso a los pines de ubicación de los titulares.</summary>
public interface ITitularUbicacionRepository
{
    Task<TitularUbicacion?> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);

    /// <summary>Todas las ubicaciones cargadas. Se usa para recálculos masivos.</summary>
    Task<List<TitularUbicacion>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ubicaciones de un conjunto de titulares. Evita el problema N+1 al calcular
    /// los recorridos de un horario completo.
    /// </summary>
    Task<List<TitularUbicacion>> GetByTitularIdsAsync(
        IReadOnlyCollection<int> titularIds,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Crea la ubicación si no existe, o mueve el pin si ya existía. Persiste los cambios.
    /// </summary>
    /// <returns>La ubicación resultante.</returns>
    Task<TitularUbicacion> UpsertAsync(TitularUbicacion ubicacion, CancellationToken cancellationToken = default);

    /// <summary>Borra el pin de un titular. No falla si no existía.</summary>
    Task DeleteByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);
}
