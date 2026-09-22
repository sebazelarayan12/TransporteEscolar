using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Acceso a las paradas fijas: la casa elegida a mano como extremo de cada viaje.</summary>
public interface IParadaFijaRepository
{
    /// <summary>Todas las paradas fijas cargadas. Se usa para el recálculo masivo.</summary>
    Task<List<ParadaFija>> GetTodasAsync(CancellationToken cancellationToken = default);

    /// <summary>Parada fija de un viaje puntual, o null si no se asignó ninguna.</summary>
    Task<ParadaFija?> GetAsync(int horarioId, byte transporte, CancellationToken cancellationToken = default);

    /// <summary>
    /// Crea la parada fija si no existe, o reasigna el titular si ya existía. Persiste los cambios.
    /// </summary>
    /// <returns>La parada fija resultante.</returns>
    Task<ParadaFija> UpsertAsync(ParadaFija paradaFija, CancellationToken cancellationToken = default);

    /// <summary>Borra la parada fija de un viaje. No falla si no existía.</summary>
    Task EliminarAsync(int horarioId, byte transporte, CancellationToken cancellationToken = default);
}
