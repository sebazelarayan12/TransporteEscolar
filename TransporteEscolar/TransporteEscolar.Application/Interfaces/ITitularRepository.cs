using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Teléfono vigente de un titular vigente. Proyección mínima para buscar por número
/// sin cargar entidades completas.
/// </summary>
/// <param name="TitularId">Titular dueño del teléfono.</param>
/// <param name="NumeroE164">Número tal como está guardado (el formato no está garantizado).</param>
public sealed record TelefonoActivo(int TitularId, string NumeroE164);

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

    /// <summary>
    /// Devuelve los teléfonos con FechaBaja == null de titulares con FechaBaja == null.
    /// Solo proyecta el id del titular y el número guardado.
    /// </summary>
    Task<List<TelefonoActivo>> GetTelefonosActivosAsync(CancellationToken cancellationToken = default);
}
