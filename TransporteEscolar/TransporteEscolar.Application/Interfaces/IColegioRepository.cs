using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Acceso a los colegios de destino.</summary>
public interface IColegioRepository
{
    /// <summary>Devuelve todos los colegios activos, ordenados por nombre.</summary>
    Task<List<Colegio>> GetActivosAsync(CancellationToken cancellationToken = default);

    /// <summary>Devuelve todos los colegios, activos e inactivos.</summary>
    Task<List<Colegio>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Colegio?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Busca un colegio por nombre ignorando mayúsculas y espacios sobrantes.
    /// Es la vía de vinculación con el campo de texto <c>Pasajero.Colegio</c>.
    /// </summary>
    Task<Colegio?> GetByNombreAsync(string nombre, CancellationToken cancellationToken = default);

    Task UpdateAsync(Colegio colegio, CancellationToken cancellationToken = default);
}
