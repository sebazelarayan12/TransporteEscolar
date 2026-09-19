using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Acceso a los recorridos calculados.</summary>
public interface IRecorridoRepository
{
    Task<Recorrido?> GetByTitularYColegioAsync(
        int titularId,
        int colegioId,
        CancellationToken cancellationToken = default);

    /// <summary>Todos los recorridos de un titular, con el colegio cargado.</summary>
    Task<List<Recorrido>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);

    /// <summary>Todos los recorridos del sistema, con el colegio cargado. Se usa en el análisis.</summary>
    Task<List<Recorrido>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Crea el recorrido o actualiza el existente. Persiste los cambios.</summary>
    Task<Recorrido> UpsertAsync(Recorrido recorrido, CancellationToken cancellationToken = default);

    /// <summary>Borra todos los recorridos de un titular. Se usa cuando se elimina su pin.</summary>
    Task DeleteByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);
}
